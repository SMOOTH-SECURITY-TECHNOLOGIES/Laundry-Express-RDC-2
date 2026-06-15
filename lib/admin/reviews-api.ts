import { features } from '../../config/features';
import { realApi, type BackendReviewsDashboardResponse } from '../../services/real-api';
import type { ReviewDetail, ReviewsDashboardSummary } from './reviews-types';

export const REVIEWS_WRITE_ENABLED = import.meta.env.VITE_REVIEWS_WRITE_ENABLED !== 'false';

let cached: ReviewsDashboardSummary | null = null;
let promise: Promise<ReviewsDashboardSummary> | null = null;
let cachedDays = 7;

export function invalidateReviewsCache(): void {
  cached = null;
  promise = null;
}

function map(raw: BackendReviewsDashboardResponse): ReviewsDashboardSummary {
  const mapReview = (r: BackendReviewsDashboardResponse['reviews'][0]) => ({
    id: r.id, clientName: r.client_name, clientId: r.client_id,
    reviewType: r.review_type, reviewTypeLabel: r.review_type_label,
    rating: r.rating, comment: r.comment, source: r.source,
    date: r.date, status: r.status, statusLabel: r.status_label,
    partnerName: r.partner_name, orderId: r.order_id,
  });
  return {
    kpis: {
      avgRating: raw.kpis.avg_rating, avgRatingChange: raw.kpis.avg_rating_change, avgRatingSparkline: raw.kpis.avg_rating_sparkline ?? [],
      totalReviews: raw.kpis.total_reviews, totalReviewsChange: raw.kpis.total_reviews_change, totalReviewsSparkline: raw.kpis.total_reviews_sparkline ?? [],
      fiveStar: raw.kpis.five_star, fiveStarChange: raw.kpis.five_star_change, fiveStarSparkline: raw.kpis.five_star_sparkline ?? [],
      lowStar: raw.kpis.low_star, lowStarChange: raw.kpis.low_star_change, lowStarSparkline: raw.kpis.low_star_sparkline ?? [],
      responseRate: raw.kpis.response_rate, responseRateChange: raw.kpis.response_rate_change, responseRateSparkline: raw.kpis.response_rate_sparkline ?? [],
      pendingReviews: raw.kpis.pending_reviews, pendingReviewsChange: raw.kpis.pending_reviews_change, pendingReviewsSparkline: raw.kpis.pending_reviews_sparkline ?? [],
      positiveSentiment: raw.kpis.positive_sentiment, positiveSentimentChange: raw.kpis.positive_sentiment_change, positiveSentimentSparkline: raw.kpis.positive_sentiment_sparkline ?? [],
      churnRisk: raw.kpis.churn_risk, churnRiskChange: raw.kpis.churn_risk_change, churnRiskSparkline: raw.kpis.churn_risk_sparkline ?? [],
    },
    reviews: raw.reviews.map(mapReview),
    ratingDistribution: raw.rating_distribution.map((d) => ({ stars: d.stars, count: d.count, percent: d.percent, change: d.change, color: d.color })),
    channels: raw.channels.map((c) => ({ channel: c.channel, count: c.count, percent: c.percent, color: c.color })),
    reviewTypes: raw.review_types.map((t) => ({ reviewType: t.review_type, count: t.count, avgRating: t.avg_rating, percent: t.percent })),
    topPartners: raw.top_partners.map((p) => ({ partnerId: p.partner_id, partnerName: p.partner_name, avgRating: p.avg_rating, reviewCount: p.review_count })),
    topDrivers: raw.top_drivers.map((d) => ({ driverId: d.driver_id, driverName: d.driver_name, avgRating: d.avg_rating, reviewCount: d.review_count })),
    negativeQueue: raw.negative_queue.map((n) => ({ id: n.id, author: n.author, problem: n.problem, date: n.date, priority: n.priority })),
    sentiment: raw.sentiment.map((s) => ({ sentiment: s.sentiment, count: s.count, percent: s.percent, color: s.color })),
    issues: raw.issues.map((i) => ({ issue: i.issue, tickets: i.tickets, variation: i.variation, impact: i.impact })),
    agents: raw.agents.map((a) => ({ agentId: a.agent_id, agentName: a.agent_name, reviewsHandled: a.reviews_handled, avgResponseMinutes: a.avg_response_minutes, satisfaction: a.satisfaction })),
    insights: raw.insights.map((i) => ({ id: i.id, text: i.text, category: i.category })),
    wordCloud: raw.word_cloud.map((w) => ({ word: w.word, weight: w.weight, color: w.color })),
    trends: raw.trends.map((t) => ({ date: t.date, avgRating: t.avg_rating, volume: t.volume })),
    source: raw.source,
  };
}

export async function fetchReviewsBundle(days = 7): Promise<ReviewsDashboardSummary> {
  if (features.useMockApi) throw new Error('Mock API désactivé pour le centre avis.');
  if (cached && cachedDays === days) return cached;
  if (promise && cachedDays === days) return promise;
  cachedDays = days;
  promise = realApi.getReviewsDashboard(days).then((raw) => { cached = map(raw); promise = null; return cached; });
  return promise;
}

export async function fetchReviewDetail(id: string): Promise<ReviewDetail> {
  const raw = await realApi.getReviewDetail(id);
  return {
    id: raw.id, clientName: raw.client_name, clientId: raw.client_id,
    reviewType: raw.review_type, reviewTypeLabel: raw.review_type_label,
    rating: raw.rating, comment: raw.comment, source: raw.source,
    date: raw.date, status: raw.status, statusLabel: raw.status_label,
    partnerName: raw.partner_name, orderId: raw.order_id,
    title: raw.title, driverName: raw.driver_name,
    aiSummary: raw.ai_summary, sentiment: raw.sentiment,
    churnRisk: raw.churn_risk, priority: raw.priority,
    recommendation: raw.recommendation, previousReplies: raw.previous_replies ?? [],
  };
}

export async function exportReviews(data: { format: string; scope: string }) {
  if (!REVIEWS_WRITE_ENABLED) throw new Error('Export désactivé (mode lecture seule).');
  return realApi.exportReviews(data);
}

export function trackReviewEvent(event: string, detail?: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event, module: 'reviews', ...detail } }));
}
