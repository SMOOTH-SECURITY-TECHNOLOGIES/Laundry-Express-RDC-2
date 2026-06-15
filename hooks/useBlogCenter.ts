import { useState, useEffect, useCallback } from 'react';
import { fetchBlogBundle, invalidateBlogCache, fetchBlogPostDetail } from '../lib/admin/blog-api';
import { realApi } from '../services/real-api';
import type {
  BlogKpis, BlogPostItem, BlogCategory, BlogTag, BlogSeoBucket,
  BlogTopPost, BlogTrend, BlogAiSuggestion, BlogCalendarDay,
} from '../lib/admin/blog-types';

export default function useBlogCenter(initialDays = 30) {
  const [kpis, setKpis] = useState<BlogKpis | null>(null);
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [seoDistribution, setSeoDistribution] = useState<BlogSeoBucket[]>([]);
  const [topPosts, setTopPosts] = useState<BlogTopPost[]>([]);
  const [trends, setTrends] = useState<BlogTrend[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<BlogAiSuggestion[]>([]);
  const [calendar, setCalendar] = useState<BlogCalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(initialDays);

  const apply = useCallback((b: Awaited<ReturnType<typeof fetchBlogBundle>>) => {
    setKpis(b.kpis); setPosts(b.posts); setCategories(b.categories); setTags(b.tags);
    setSeoDistribution(b.seoDistribution); setTopPosts(b.topPosts); setTrends(b.trends);
    setAiSuggestions(b.aiSuggestions); setCalendar(b.calendar);
  }, []);

  const loadData = useCallback(async (d = days) => {
    setLoading(true); setError(null);
    try { apply(await fetchBlogBundle(d)); }
    catch { setError('Impossible de charger le blog.'); }
    finally { setLoading(false); }
  }, [apply, days]);

  const refresh = useCallback(async (d?: number) => {
    if (d !== undefined) setDays(d);
    invalidateBlogCache();
    await loadData(d ?? days);
  }, [loadData, days]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { setLoading(false); setError('Session requise.'); return; }
    loadData(initialDays);
  }, [loadData, initialDays]);

  return {
    kpis, posts, categories, tags, seoDistribution, topPosts, trends, aiSuggestions, calendar,
    loading, error, days, refresh,
    handlePostDetail: (id: string) => fetchBlogPostDetail(id),
    handleCreatePost: async (data: { title: string; slug: string }) => realApi.createBlogPost(data),
    handlePublish: async (id: string) => realApi.publishBlogPost(id),
    handleAiGenerate: async (topic: string) => realApi.generateBlogAI(topic),
    handleSeoAudit: async (id: string) => realApi.auditBlogSEO(id),
  };
}
