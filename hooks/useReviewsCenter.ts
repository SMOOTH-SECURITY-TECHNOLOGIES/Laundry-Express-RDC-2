import { useState, useEffect, useCallback } from 'react';
import { fetchReviewsBundle, invalidateReviewsCache, exportReviews, fetchReviewDetail } from '../lib/admin/reviews-api';
import { realApi } from '../services/real-api';
import type {
  ReviewsKpis, ReviewItem, RatingDistribution, ChannelDistribution, ReviewTypeBreakdown,
  TopPartner, TopDriver, NegativeReview, SentimentBreakdown, ReviewIssue, ReviewAgent,
  AiInsight, WordCloudItem, ReviewTrend,
} from '../lib/admin/reviews-types';

export default function useReviewsCenter(initialDays = 7) {
  const [kpis, setKpis] = useState<ReviewsKpis | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);
  const [channels, setChannels] = useState<ChannelDistribution[]>([]);
  const [reviewTypes, setReviewTypes] = useState<ReviewTypeBreakdown[]>([]);
  const [topPartners, setTopPartners] = useState<TopPartner[]>([]);
  const [topDrivers, setTopDrivers] = useState<TopDriver[]>([]);
  const [negativeQueue, setNegativeQueue] = useState<NegativeReview[]>([]);
  const [sentiment, setSentiment] = useState<SentimentBreakdown[]>([]);
  const [issues, setIssues] = useState<ReviewIssue[]>([]);
  const [agents, setAgents] = useState<ReviewAgent[]>([]);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [wordCloud, setWordCloud] = useState<WordCloudItem[]>([]);
  const [trends, setTrends] = useState<ReviewTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('backend');
  const [days, setDays] = useState(initialDays);

  const applyBundle = useCallback((b: Awaited<ReturnType<typeof fetchReviewsBundle>>) => {
    setKpis(b.kpis); setReviews(b.reviews); setRatingDistribution(b.ratingDistribution);
    setChannels(b.channels); setReviewTypes(b.reviewTypes); setTopPartners(b.topPartners);
    setTopDrivers(b.topDrivers); setNegativeQueue(b.negativeQueue); setSentiment(b.sentiment);
    setIssues(b.issues); setAgents(b.agents); setInsights(b.insights);
    setWordCloud(b.wordCloud); setTrends(b.trends); setSource(b.source);
  }, []);

  const loadData = useCallback(async (d = days) => {
    setLoading(true); setError(null);
    try { applyBundle(await fetchReviewsBundle(d)); }
    catch { setError('Impossible de charger les avis.'); }
    finally { setLoading(false); }
  }, [applyBundle, days]);

  const refresh = useCallback(async (d?: number) => {
    if (d !== undefined) setDays(d);
    invalidateReviewsCache();
    await loadData(d ?? days);
  }, [loadData, days]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { setLoading(false); setError('Session requise. Reconnectez-vous en tant qu\'administrateur.'); return; }
    loadData(initialDays);
  }, [loadData, initialDays]);

  return {
    kpis, reviews, ratingDistribution, channels, reviewTypes, topPartners, topDrivers,
    negativeQueue, sentiment, issues, agents, insights, wordCloud, trends,
    loading, error, source, days, refresh,
    handleExport: async (format = 'csv') => exportReviews({ format, scope: 'reviews' }),
    handleReviewDetail: (id: string) => fetchReviewDetail(id),
    handleReply: async (id: string, content: string) => realApi.replyReview(id, content),
    handleEscalate: async (id: string) => realApi.escalateReview(id),
    handleReport: async (id: string) => realApi.reportReview(id),
  };
}
