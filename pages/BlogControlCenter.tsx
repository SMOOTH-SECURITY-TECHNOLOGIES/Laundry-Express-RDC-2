import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useBlogCenter from '../hooks/useBlogCenter';
import { BlogHeader } from '../components/admin/blog/BlogHeader';
import { BlogKpiCards } from '../components/admin/blog/BlogKpiCards';
import { BlogPostsTable } from '../components/admin/blog/BlogPostsTable';
import { BlogSidebar } from '../components/admin/blog/BlogSidebar';
import { BlogSeoChart } from '../components/admin/blog/BlogSeoChart';
import { BlogTrendChart } from '../components/admin/blog/BlogTrendChart';
import { BlogTopPosts } from '../components/admin/blog/BlogTopPosts';
import { BlogAiSuggestions } from '../components/admin/blog/BlogAiSuggestions';
import { BlogQuickActions } from '../components/admin/blog/BlogQuickActions';
import { BlogPostDrawer } from '../components/admin/blog/BlogPostDrawer';
import { trackBlogEvent } from '../lib/admin/blog-api';
import type { BlogPostDetail, BlogPostItem } from '../lib/admin/blog-types';

function LoadingSkeleton() {
  return <div className="space-y-6"><div className="h-28 bg-white rounded-2xl border animate-pulse" /><div className="grid grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border animate-pulse" />)}</div></div>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="bg-white rounded-2xl border p-8 text-center max-w-md">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger le blog.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm">Réessayer</button>
      </div>
    </div>
  );
}

export const BlogControlCenter: React.FC = () => {
  const {
    kpis, posts, categories, tags, seoDistribution, topPosts, trends, aiSuggestions,
    loading, error, refresh, handlePostDetail, handleCreatePost, handlePublish,
    handleAiGenerate, handleSeoAudit,
  } = useBlogCenter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detail, setDetail] = useState<BlogPostDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackBlogEvent('admin_blog_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const filtered = useMemo(() => {
    let list = posts;
    if (search) { const q = search.toLowerCase(); list = list.filter((p) => p.title.toLowerCase().includes(q) || p.slug.includes(q)); }
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
    return list;
  }, [posts, search, statusFilter]);

  const openPost = useCallback(async (p: BlogPostItem) => {
    setDrawerLoading(true); setDetail(null);
    try { setDetail(await handlePostDetail(p.id)); }
    catch { setToast('Impossible de charger l\'article'); }
    finally { setDrawerLoading(false); }
  }, [handlePostDetail]);

  const onNewPost = useCallback(async () => {
    const title = window.prompt('Titre de l\'article');
    if (!title) return;
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try { await handleCreatePost({ title, slug }); setToast('Article créé'); refresh(); }
    catch { setToast('Création impossible'); }
  }, [handleCreatePost, refresh]);

  const onAi = useCallback(async () => {
    const topic = window.prompt('Sujet pour génération IA');
    if (!topic) return;
    try {
      const res = await handleAiGenerate(topic);
      setToast(`IA : « ${res.title.slice(0, 40)}... » généré`);
    } catch { setToast('Génération IA impossible'); }
  }, [handleAiGenerate]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;

  return (
    <div className="space-y-6">
      <BlogHeader search={search} onSearchChange={setSearch} onRefresh={() => refresh()} onNewPost={onNewPost} />
      <div className="flex flex-wrap gap-2">
        {['all', 'published', 'draft', 'review', 'scheduled'].map((s) => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-xl text-sm border ${statusFilter === s ? 'bg-purple-600 text-white border-purple-600' : 'bg-white'}`}>
            {s === 'all' ? 'Tous' : s === 'published' ? 'Publiés' : s === 'draft' ? 'Brouillons' : s === 'review' ? 'En révision' : 'Programmés'}
          </button>
        ))}
      </div>
      {kpis && <BlogKpiCards kpis={kpis} />}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1"><BlogSidebar categories={categories} tags={tags} /></div>
        <div className="xl:col-span-2 space-y-6">
          <BlogPostsTable posts={filtered} onView={openPost} />
          <BlogTopPosts posts={topPosts} />
        </div>
        <div className="xl:col-span-1 space-y-6">
          <BlogQuickActions onNewPost={onNewPost} onAiGenerate={onAi} />
          <BlogTrendChart trends={trends} />
          <BlogSeoChart data={seoDistribution} avgScore={kpis?.avgSeoScore ?? 0} />
          <BlogAiSuggestions suggestions={aiSuggestions} />
        </div>
      </div>
      {(detail || drawerLoading) && (
        <BlogPostDrawer
          post={detail} loading={drawerLoading && !detail} onClose={() => setDetail(null)}
          onPublish={async () => { if (!detail) return; try { await handlePublish(detail.id); setToast('Article publié'); setDetail(null); refresh(); } catch { setToast('Publication impossible'); } }}
          onSeoAudit={async () => { if (!detail) return; try { const r = await handleSeoAudit(detail.id); setToast(`SEO score : ${r.score}/100`); refresh(); } catch { setToast('Audit impossible'); } }}
        />
      )}
      {toast && <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg">{toast}</div>}
    </div>
  );
};
