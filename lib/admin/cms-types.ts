export interface CmsKpis {
  publishedPages: number; publishedChange: number; publishedSparkline: number[];
  drafts: number; draftsChange: number; draftsSparkline: number[];
  scheduledPages: number; scheduledChange: number; scheduledSparkline: number[];
  blogPosts: number; blogChange: number; blogSparkline: number[];
  visitors7d: number; visitorsChange: number; visitorsSparkline: number[];
  conversions7d: number; conversionsChange: number; conversionsSparkline: number[];
  avgSeoScore: number; seoChange: number; seoSparkline: number[];
  revenueGenerated: number; revenueChange: number; revenueSparkline: number[];
}

export interface CmsPageItem {
  id: string; slug: string; title: string; pageType: string; pageTypeLabel: string;
  status: string; statusLabel: string; language: string; updatedAt: string | null;
  views7d: number; seoScore: number; thumbnailUrl?: string | null;
}

export interface CmsSiteTreeNode { id: string; label: string; slug: string; children?: CmsSiteTreeNode[] }
export interface CmsPublicationStatus { status: string; label: string; count: number; percent: number; color: string }
export interface CmsTopPage { pageId: string; title: string; slug: string; views: number; percent: number }
export interface CmsRevision { id: string; pageTitle: string; action: string; userName: string; createdAt: string | null }
export interface CmsLanguage { language: string; label: string; pageCount: number }
export interface CmsTemplate { key: string; label: string; description: string; previewUrl?: string | null }
export interface CmsMedia { id: string; filename: string; fileUrl: string; mimeType?: string | null; size?: number | null; thumbnailUrl?: string | null }
export interface CmsAiSuggestion { id: string; text: string; category: string }

export interface CmsPageDetail extends CmsPageItem {
  description?: string | null; seoTitle?: string | null; seoDescription?: string | null;
  blocks: Array<Record<string, unknown>>; sections: Array<Record<string, unknown>>;
  faqs: Array<{ id: string; question: string; answer: string; position: number }>;
  revisions: Array<{ id: string; note: string; created_at: string | null }>;
}

export interface CmsDashboardSummary {
  kpis: CmsKpis; pages: CmsPageItem[]; siteTree: CmsSiteTreeNode[];
  publicationStatus: CmsPublicationStatus[]; seoScore: number;
  seoChecklist: Array<{ label: string; done: number; total: number }>;
  topPages: CmsTopPage[]; recentRevisions: CmsRevision[];
  languages: CmsLanguage[]; templates: CmsTemplate[];
  aiSuggestions: CmsAiSuggestion[]; recentMedia: CmsMedia[];
  source: string;
}
