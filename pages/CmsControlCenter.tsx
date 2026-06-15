import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useCmsCenter from '../hooks/useCmsCenter';
import { CmsHeader } from '../components/admin/cms/CmsHeader';
import { CmsKpiCards } from '../components/admin/cms/CmsKpiCards';
import { CmsSiteTree } from '../components/admin/cms/CmsSiteTree';
import { CmsPagesTable } from '../components/admin/cms/CmsPagesTable';
import { CmsQuickActions } from '../components/admin/cms/CmsQuickActions';
import { CmsPublicationChart } from '../components/admin/cms/CmsPublicationChart';
import { CmsSeoCard } from '../components/admin/cms/CmsSeoCard';
import { CmsTopPages } from '../components/admin/cms/CmsTopPages';
import { CmsRevisionsTable } from '../components/admin/cms/CmsRevisionsTable';
import { CmsLanguages } from '../components/admin/cms/CmsLanguages';
import { CmsTemplates } from '../components/admin/cms/CmsTemplates';
import { CmsAiAssistant } from '../components/admin/cms/CmsAiAssistant';
import { CmsMediaGallery } from '../components/admin/cms/CmsMediaGallery';
import { CmsPageDrawer } from '../components/admin/cms/CmsPageDrawer';
import { trackCmsEvent } from '../lib/admin/cms-api';
import type { CmsPageDetail, CmsPageItem } from '../lib/admin/cms-types';

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <div className="h-28 bg-white rounded-2xl border animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />)}</div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
        <Icon name="warning" className="w-8 h-8 text-red-600 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-4">Impossible de charger le CMS.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

export const CmsControlCenter: React.FC = () => {
  const {
    kpis, pages, siteTree, publicationStatus, seoScore, seoChecklist,
    topPages, recentRevisions, languages, templates, aiSuggestions, recentMedia,
    loading, error, refresh, handlePageDetail, handleCreatePage, handlePublish,
  } = useCmsCenter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [detail, setDetail] = useState<CmsPageDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackCmsEvent('admin_cms_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const filtered = useMemo(() => {
    let list = pages;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
    if (typeFilter !== 'all') list = list.filter((p) => p.pageType === typeFilter);
    return list;
  }, [pages, search, statusFilter, typeFilter]);

  const openPage = useCallback(async (p: CmsPageItem) => {
    setDrawerLoading(true); setDetail(null);
    try { setDetail(await handlePageDetail(p.id)); }
    catch { setToast('Impossible de charger la page'); }
    finally { setDrawerLoading(false); }
  }, [handlePageDetail]);

  const onNewPage = useCallback(async () => {
    const title = window.prompt('Titre de la page');
    if (!title) return;
    const slug = window.prompt('Slug (ex: /ma-page)', `/${title.toLowerCase().replace(/\s+/g, '-')}`);
    if (!slug) return;
    try {
      const res = await handleCreatePage({ title, slug, page_type: 'custom' });
      setToast(`Page « ${res.title} » créée`);
      refresh();
    } catch { setToast('Création impossible'); }
  }, [handleCreatePage, refresh]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <CmsHeader search={search} onSearchChange={setSearch} onRefresh={() => refresh()} onNewPage={onNewPage} />
      <div className="flex flex-wrap gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-xl text-sm bg-white">
          <option value="all">Tous statuts</option>
          <option value="published">Publié</option>
          <option value="draft">Brouillon</option>
          <option value="scheduled">Programmé</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-xl text-sm bg-white">
          <option value="all">Tous types</option>
          <option value="home">Accueil</option>
          <option value="landing">Landing</option>
          <option value="service">Service</option>
          <option value="blog">Blog</option>
          <option value="faq">FAQ</option>
        </select>
      </div>
      {kpis && <CmsKpiCards kpis={kpis} />}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <CmsSiteTree tree={siteTree} />
          <CmsQuickActions onNewPage={onNewPage} />
        </div>
        <div className="xl:col-span-2 space-y-6">
          <CmsPagesTable pages={filtered} onView={openPage} />
          <CmsRevisionsTable revisions={recentRevisions} />
          <CmsMediaGallery media={recentMedia} />
        </div>
        <div className="xl:col-span-1 space-y-6">
          <CmsPublicationChart data={publicationStatus} />
          <CmsSeoCard score={seoScore} checklist={seoChecklist} />
          <CmsTopPages pages={topPages} />
          <CmsLanguages languages={languages} />
          <CmsTemplates templates={templates} />
          <CmsAiAssistant suggestions={aiSuggestions} />
        </div>
      </div>
      {(detail || drawerLoading) && (
        <CmsPageDrawer
          page={detail}
          loading={drawerLoading && !detail}
          onClose={() => setDetail(null)}
          onPublish={async () => { if (!detail) return; try { await handlePublish(detail.id); setToast('Page publiée'); setDetail(null); refresh(); } catch { setToast('Publication impossible'); } }}
        />
      )}
      {toast && <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg">{toast}</div>}
    </div>
  );
};
