import { useState, useEffect, useCallback } from 'react';
import { fetchCmsBundle, invalidateCmsCache, fetchCmsPageDetail } from '../lib/admin/cms-api';
import { realApi } from '../services/real-api';
import type {
  CmsKpis, CmsPageItem, CmsSiteTreeNode, CmsPublicationStatus, CmsTopPage,
  CmsRevision, CmsLanguage, CmsTemplate, CmsMedia, CmsAiSuggestion,
} from '../lib/admin/cms-types';

export default function useCmsCenter(initialDays = 7) {
  const [kpis, setKpis] = useState<CmsKpis | null>(null);
  const [pages, setPages] = useState<CmsPageItem[]>([]);
  const [siteTree, setSiteTree] = useState<CmsSiteTreeNode[]>([]);
  const [publicationStatus, setPublicationStatus] = useState<CmsPublicationStatus[]>([]);
  const [seoScore, setSeoScore] = useState(0);
  const [seoChecklist, setSeoChecklist] = useState<Array<{ label: string; done: number; total: number }>>([]);
  const [topPages, setTopPages] = useState<CmsTopPage[]>([]);
  const [recentRevisions, setRecentRevisions] = useState<CmsRevision[]>([]);
  const [languages, setLanguages] = useState<CmsLanguage[]>([]);
  const [templates, setTemplates] = useState<CmsTemplate[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<CmsAiSuggestion[]>([]);
  const [recentMedia, setRecentMedia] = useState<CmsMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(initialDays);

  const applyBundle = useCallback((b: Awaited<ReturnType<typeof fetchCmsBundle>>) => {
    setKpis(b.kpis); setPages(b.pages); setSiteTree(b.siteTree);
    setPublicationStatus(b.publicationStatus); setSeoScore(b.seoScore);
    setSeoChecklist(b.seoChecklist); setTopPages(b.topPages);
    setRecentRevisions(b.recentRevisions); setLanguages(b.languages);
    setTemplates(b.templates); setAiSuggestions(b.aiSuggestions);
    setRecentMedia(b.recentMedia);
  }, []);

  const loadData = useCallback(async (d = days) => {
    setLoading(true); setError(null);
    try { applyBundle(await fetchCmsBundle(d)); }
    catch { setError('Impossible de charger le CMS.'); }
    finally { setLoading(false); }
  }, [applyBundle, days]);

  const refresh = useCallback(async (d?: number) => {
    if (d !== undefined) setDays(d);
    invalidateCmsCache();
    await loadData(d ?? days);
  }, [loadData, days]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { setLoading(false); setError('Session requise. Reconnectez-vous en tant qu\'administrateur.'); return; }
    loadData(initialDays);
  }, [loadData, initialDays]);

  return {
    kpis, pages, siteTree, publicationStatus, seoScore, seoChecklist,
    topPages, recentRevisions, languages, templates, aiSuggestions, recentMedia,
    loading, error, days, refresh,
    handlePageDetail: (id: string) => fetchCmsPageDetail(id),
    handleCreatePage: async (data: { title: string; slug: string; page_type?: string }) => realApi.createCmsPage(data),
    handlePublish: async (id: string) => realApi.publishCmsPage(id),
    handleUpdatePage: async (id: string, data: Record<string, unknown>) => realApi.updateCmsPage(id, data),
  };
}
