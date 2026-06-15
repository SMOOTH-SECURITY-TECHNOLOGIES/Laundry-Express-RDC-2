export interface ReviewsKpis {
  avgRating: number; avgRatingChange: number; avgRatingSparkline: number[];
  totalReviews: number; totalReviewsChange: number; totalReviewsSparkline: number[];
  fiveStar: number; fiveStarChange: number; fiveStarSparkline: number[];
  lowStar: number; lowStarChange: number; lowStarSparkline: number[];
  responseRate: number; responseRateChange: number; responseRateSparkline: number[];
  pendingReviews: number; pendingReviewsChange: number; pendingReviewsSparkline: number[];
  positiveSentiment: number; positiveSentimentChange: number; positiveSentimentSparkline: number[];
  churnRisk: number; churnRiskChange: number; churnRiskSparkline: number[];
}

export interface ReviewItem {
  id: string; clientName: string; clientId: string;
  reviewType: string; reviewTypeLabel: string; rating: number;
  comment: string; source: string; date: string | null;
  status: string; statusLabel: string;
  partnerName?: string | null; orderId?: string | null;
}

export interface ReviewDetail extends ReviewItem {
  title?: string | null; driverName?: string | null;
  aiSummary: string; sentiment: string; churnRisk: string;
  priority: string; recommendation: string; previousReplies: string[];
}

export interface RatingDistribution { stars: number; count: number; percent: number; change: number; color: string }
export interface ChannelDistribution { channel: string; count: number; percent: number; color: string }
export interface ReviewTypeBreakdown { reviewType: string; count: number; avgRating: number; percent: number }
export interface TopPartner { partnerId: string; partnerName: string; avgRating: number; reviewCount: number }
export interface TopDriver { driverId: string; driverName: string; avgRating: number; reviewCount: number }
export interface NegativeReview { id: string; author: string; problem: string; date: string | null; priority: string }
export interface SentimentBreakdown { sentiment: string; count: number; percent: number; color: string }
export interface ReviewIssue { issue: string; tickets: number; variation: number; impact: string }
export interface ReviewAgent { agentId: string; agentName: string; reviewsHandled: number; avgResponseMinutes: number; satisfaction: number }
export interface AiInsight { id: string; text: string; category: string }
export interface WordCloudItem { word: string; weight: number; color: string }
export interface ReviewTrend { date: string; avgRating: number; volume: number }

export interface ReviewsDashboardSummary {
  kpis: ReviewsKpis;
  reviews: ReviewItem[];
  ratingDistribution: RatingDistribution[];
  channels: ChannelDistribution[];
  reviewTypes: ReviewTypeBreakdown[];
  topPartners: TopPartner[];
  topDrivers: TopDriver[];
  negativeQueue: NegativeReview[];
  sentiment: SentimentBreakdown[];
  issues: ReviewIssue[];
  agents: ReviewAgent[];
  insights: AiInsight[];
  wordCloud: WordCloudItem[];
  trends: ReviewTrend[];
  source: string;
}
