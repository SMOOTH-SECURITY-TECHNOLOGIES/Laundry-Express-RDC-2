import { features } from '../../config/features';
import { realApi, type BackendBlogDashboardResponse } from '../../services/real-api';
import type { BlogDashboardSummary, BlogPostDetail } from './blog-types';

export const BLOG_WRITE_ENABLED = import.meta.env.VITE_BLOG_WRITE_ENABLED !== 'false';

let cached: BlogDashboardSummary | null = null;
let promise: Promise<BlogDashboardSummary> | null = null;
let cachedDays = 30;

export function invalidateBlogCache(): void { cached = null; promise = null; }

function mapPost(p: BackendBlogDashboardResponse['posts'][0]) {
  return {
    id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt,
    authorName: p.author_name, authorAvatar: p.author_avatar,
    category: p.category, categoryColor: p.category_color,
    status: p.status, statusLabel: p.status_label,
    seoScore: p.seo_score, viewsCount: p.views_count, commentsCount: p.comments_count,
    publishedAt: p.published_at, featuredImage: p.featured_image,
  };
}

function map(raw: BackendBlogDashboardResponse): BlogDashboardSummary {
  return {
    kpis: {
      publishedPosts: raw.kpis.published_posts, publishedChange: raw.kpis.published_change, publishedSparkline: raw.kpis.published_sparkline ?? [],
      drafts: raw.kpis.drafts, draftsChange: raw.kpis.drafts_change, draftsSparkline: raw.kpis.drafts_sparkline ?? [],
      scheduledPosts: raw.kpis.scheduled_posts, scheduledChange: raw.kpis.scheduled_change, scheduledSparkline: raw.kpis.scheduled_sparkline ?? [],
      monthlyViews: raw.kpis.monthly_views, monthlyViewsChange: raw.kpis.monthly_views_change, monthlyViewsSparkline: raw.kpis.monthly_views_sparkline ?? [],
      leadsGenerated: raw.kpis.leads_generated, leadsChange: raw.kpis.leads_change, leadsSparkline: raw.kpis.leads_sparkline ?? [],
      conversions: raw.kpis.conversions, conversionsChange: raw.kpis.conversions_change, conversionsSparkline: raw.kpis.conversions_sparkline ?? [],
      avgSeoScore: raw.kpis.avg_seo_score, seoChange: raw.kpis.seo_change, seoSparkline: raw.kpis.seo_sparkline ?? [],
    },
    posts: raw.posts.map(mapPost),
    categories: raw.categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, postCount: c.post_count, color: c.color })),
    tags: raw.tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, postCount: t.post_count })),
    seoDistribution: raw.seo_distribution.map((s) => ({ label: s.label, count: s.count, percent: s.percent, color: s.color })),
    topPosts: raw.top_posts.map((p) => ({ postId: p.post_id, title: p.title, views: p.views, ctr: p.ctr, leads: p.leads, seoScore: p.seo_score })),
    trends: raw.trends.map((t) => ({ date: t.date, views: t.views, leads: t.leads })),
    aiSuggestions: raw.ai_suggestions.map((a) => ({ id: a.id, text: a.text, category: a.category })),
    calendar: raw.calendar.map((c) => ({ date: c.date, postCount: c.post_count })),
    source: raw.source,
  };
}

export async function fetchBlogBundle(days = 30): Promise<BlogDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour le blog.');
  if (cached && cachedDays === days) return cached;
  if (promise && cachedDays === days) return promise;
  cachedDays = days;
  promise = realApi.getBlogDashboard(days).then((raw) => { cached = map(raw); promise = null; return cached; });
  return promise;
}

export async function fetchBlogPostDetail(id: string): Promise<BlogPostDetail> {
  const raw = await realApi.getBlogPostDetail(id);
  return {
    ...mapPost(raw),
    content: raw.content, readingTime: raw.reading_time,
    contentBlocks: raw.content_blocks ?? [], tags: raw.tags ?? [],
    seo: raw.seo ?? {}, revisions: (raw.revisions ?? []).map((r) => ({ id: r.id, note: r.note })),
  };
}

export function trackBlogEvent(event: string, detail?: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event, module: 'blog', ...detail } }));
}
