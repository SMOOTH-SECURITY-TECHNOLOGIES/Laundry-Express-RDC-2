export interface BlogKpis {
  publishedPosts: number; publishedChange: number; publishedSparkline: number[];
  drafts: number; draftsChange: number; draftsSparkline: number[];
  scheduledPosts: number; scheduledChange: number; scheduledSparkline: number[];
  monthlyViews: number; monthlyViewsChange: number; monthlyViewsSparkline: number[];
  leadsGenerated: number; leadsChange: number; leadsSparkline: number[];
  conversions: number; conversionsChange: number; conversionsSparkline: number[];
  avgSeoScore: number; seoChange: number; seoSparkline: number[];
}

export interface BlogPostItem {
  id: string; slug: string; title: string; excerpt: string;
  authorName: string; authorAvatar?: string | null;
  category: string; categoryColor: string;
  status: string; statusLabel: string;
  seoScore: number; viewsCount: number; commentsCount: number;
  publishedAt: string | null; featuredImage?: string | null;
}

export interface BlogCategory { id: string; name: string; slug: string; postCount: number; color: string }
export interface BlogTag { id: string; name: string; slug: string; postCount: number }
export interface BlogSeoBucket { label: string; count: number; percent: number; color: string }
export interface BlogTopPost { postId: string; title: string; views: number; ctr: number; leads: number; seoScore: number }
export interface BlogTrend { date: string; views: number; leads: number }
export interface BlogAiSuggestion { id: string; text: string; category: string }
export interface BlogCalendarDay { date: string; postCount: number }

export interface BlogPostDetail extends BlogPostItem {
  content: string; readingTime: number;
  contentBlocks: Array<Record<string, unknown>>;
  tags: string[]; seo: Record<string, unknown>;
  revisions: Array<{ id: string; note: string }>;
}

export interface BlogDashboardSummary {
  kpis: BlogKpis; posts: BlogPostItem[];
  categories: BlogCategory[]; tags: BlogTag[];
  seoDistribution: BlogSeoBucket[]; topPosts: BlogTopPost[];
  trends: BlogTrend[]; aiSuggestions: BlogAiSuggestion[];
  calendar: BlogCalendarDay[]; source: string;
}
