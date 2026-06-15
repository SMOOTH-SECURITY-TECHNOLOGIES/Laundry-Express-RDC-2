import { features } from '../../config/features';
import { realApi, type BackendCmsDashboardResponse } from '../../services/real-api';
import type { CmsDashboardSummary, CmsPageDetail } from './cms-types';

export const CMS_WRITE_ENABLED = import.meta.env.VITE_CMS_WRITE_ENABLED !== 'false';

let cached: CmsDashboardSummary | null = null;
let promise: Promise<CmsDashboardSummary> | null = null;
let cachedDays = 7;

export function invalidateCmsCache(): void {
  cached = null;
  promise = null;
}

function mapPage(p: BackendCmsDashboardResponse['pages'][0]) {
  return {
    id: p.id, slug: p.slug, title: p.title, pageType: p.page_type, pageTypeLabel: p.page_type_label,
    status: p.status, statusLabel: p.status_label, language: p.language,
    updatedAt: p.updated_at, views7d: p.views_7d, seoScore: p.seo_score, thumbnailUrl: p.thumbnail_url,
  };
}

function map(raw: BackendCmsDashboardResponse): CmsDashboardSummary {
  return {
    kpis: {
      publishedPages: raw.kpis.published_pages, publishedChange: raw.kpis.published_change, publishedSparkline: raw.kpis.published_sparkline ?? [],
      drafts: raw.kpis.drafts, draftsChange: raw.kpis.drafts_change, draftsSparkline: raw.kpis.drafts_sparkline ?? [],
      scheduledPages: raw.kpis.scheduled_pages, scheduledChange: raw.kpis.scheduled_change, scheduledSparkline: raw.kpis.scheduled_sparkline ?? [],
      blogPosts: raw.kpis.blog_posts, blogChange: raw.kpis.blog_change, blogSparkline: raw.kpis.blog_sparkline ?? [],
      visitors7d: raw.kpis.visitors_7d, visitorsChange: raw.kpis.visitors_change, visitorsSparkline: raw.kpis.visitors_sparkline ?? [],
      conversions7d: raw.kpis.conversions_7d, conversionsChange: raw.kpis.conversions_change, conversionsSparkline: raw.kpis.conversions_sparkline ?? [],
      avgSeoScore: raw.kpis.avg_seo_score, seoChange: raw.kpis.seo_change, seoSparkline: raw.kpis.seo_sparkline ?? [],
      revenueGenerated: raw.kpis.revenue_generated, revenueChange: raw.kpis.revenue_change, revenueSparkline: raw.kpis.revenue_sparkline ?? [],
    },
    pages: raw.pages.map(mapPage),
    siteTree: raw.site_tree.map((n) => ({ id: n.id, label: n.label, slug: n.slug, children: n.children?.map((c) => ({ id: c.id, label: c.label, slug: c.slug })) })),
    publicationStatus: raw.publication_status.map((s) => ({ status: s.status, label: s.label, count: s.count, percent: s.percent, color: s.color })),
    seoScore: raw.seo_score,
    seoChecklist: raw.seo_checklist.map((c) => ({ label: String(c.label ?? ''), done: c.done as number, total: c.total as number })),
    topPages: raw.top_pages.map((p) => ({ pageId: p.page_id, title: p.title, slug: p.slug, views: p.views, percent: p.percent })),
    recentRevisions: raw.recent_revisions.map((r) => ({ id: r.id, pageTitle: r.page_title, action: r.action, userName: r.user_name, createdAt: r.created_at })),
    languages: raw.languages.map((l) => ({ language: l.language, label: l.label, pageCount: l.page_count })),
    templates: raw.templates.map((t) => ({ key: t.key, label: t.label, description: t.description, previewUrl: t.preview_url })),
    aiSuggestions: raw.ai_suggestions.map((a) => ({ id: a.id, text: a.text, category: a.category })),
    recentMedia: raw.recent_media.map((m) => ({ id: m.id, filename: m.filename, fileUrl: m.file_url, mimeType: m.mime_type, size: m.size, thumbnailUrl: m.thumbnail_url })),
    source: raw.source,
  };
}

export async function fetchCmsBundle(days = 7): Promise<CmsDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour le CMS.');
  if (cached && cachedDays === days) return cached;
  if (promise && cachedDays === days) return promise;
  cachedDays = days;
  promise = realApi.getCmsDashboard(days).then((raw) => { cached = map(raw); promise = null; return cached; });
  return promise;
}

export async function fetchCmsPageDetail(id: string): Promise<CmsPageDetail> {
  const raw = await realApi.getCmsPageDetail(id);
  return {
    ...mapPage(raw),
    description: raw.description, seoTitle: raw.seo_title, seoDescription: raw.seo_description,
    blocks: raw.blocks ?? [], sections: raw.sections ?? [],
    faqs: (raw.faqs ?? []).map((f) => ({ id: f.id, question: f.question, answer: f.answer, position: f.position })),
    revisions: (raw.revisions ?? []).map((r) => ({ id: r.id, note: r.note, created_at: r.created_at })),
  };
}

export function trackCmsEvent(event: string, detail?: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event, module: 'cms', ...detail } }));
}
