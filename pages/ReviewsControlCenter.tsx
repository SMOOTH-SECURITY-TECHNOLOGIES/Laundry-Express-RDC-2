import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import useReviewsCenter from '../hooks/useReviewsCenter';
import { ReviewsHeader } from '../components/admin/reviews/ReviewsHeader';
import { ReviewsFilters } from '../components/admin/reviews/ReviewsFilters';
import { ReviewsKpiCards } from '../components/admin/reviews/ReviewsKpiCards';
import { ReviewsTrendChart } from '../components/admin/reviews/ReviewsTrendChart';
import { ReviewsTable } from '../components/admin/reviews/ReviewsTable';
import { ReviewDetailDrawer } from '../components/admin/reviews/ReviewDetailDrawer';
import { RatingDistributionChart } from '../components/admin/reviews/RatingDistributionChart';
import { ChannelDistributionChart } from '../components/admin/reviews/ChannelDistributionChart';
import { ReviewTypeChart } from '../components/admin/reviews/ReviewTypeChart';
import { TopPartnersTable } from '../components/admin/reviews/TopPartnersTable';
import { TopDriversTable } from '../components/admin/reviews/TopDriversTable';
import { NegativeReviewsQueue } from '../components/admin/reviews/NegativeReviewsQueue';
import { SentimentAnalysis } from '../components/admin/reviews/SentimentAnalysis';
import { IssuesTable } from '../components/admin/reviews/IssuesTable';
import { AgentPerformanceTable } from '../components/admin/reviews/AgentPerformanceTable';
import { ActionsPanel } from '../components/admin/reviews/ActionsPanel';
import { AiInsightsPanel } from '../components/admin/reviews/AiInsightsPanel';
import { WordCloudPanel } from '../components/admin/reviews/WordCloudPanel';
import { trackReviewEvent } from '../lib/admin/reviews-api';
import type { ReviewDetail, ReviewItem } from '../lib/admin/reviews-types';

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
        <h2 className="text-lg font-semibold mb-4">Impossible de charger les avis.</h2>
        <button type="button" onClick={onRetry} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-dashed p-12 text-center">
      <Icon name="star" className="w-10 h-10 text-gray-300 mx-auto mb-4" />
      <p className="text-sm font-medium">Aucun avis enregistré.</p>
      <p className="text-xs text-gray-500 mt-2">Les avis clients apparaîtront ici après leurs commandes.</p>
    </div>
  );
}

export const ReviewsControlCenter: React.FC = () => {
  const {
    kpis, reviews, ratingDistribution, channels, reviewTypes, topPartners, topDrivers,
    negativeQueue, sentiment, issues, agents, insights, wordCloud, trends,
    loading, error, days, refresh, handleExport, handleReviewDetail, handleReply, handleEscalate, handleReport,
  } = useReviewsCenter();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [detail, setDetail] = useState<ReviewDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { trackReviewEvent('admin_reviews_viewed'); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  const filtered = useMemo(() => {
    let list = reviews;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.clientName.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q) || (r.partnerName?.toLowerCase().includes(q)));
    }
    if (typeFilter !== 'all') list = list.filter((r) => r.reviewType === typeFilter);
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    if (channelFilter !== 'all') list = list.filter((r) => r.source.toLowerCase().includes(channelFilter));
    return list;
  }, [reviews, search, typeFilter, statusFilter, channelFilter]);

  const onFilter = useCallback((type: string, value: string) => {
    trackReviewEvent('review_filter_changed', { type, value });
    if (type === 'type') setTypeFilter(value);
    if (type === 'status') setStatusFilter(value);
    if (type === 'channel') setChannelFilter(value);
    if (type === 'city') setCityFilter(value);
    if (type === 'partner') setPartnerFilter(value);
    if (type === 'driver') setDriverFilter(value);
  }, []);

  const openReview = useCallback(async (r: ReviewItem) => {
    setDrawerLoading(true); setDetail(null);
    trackReviewEvent('review_opened', { reviewId: r.id });
    try { setDetail(await handleReviewDetail(r.id)); }
    catch { setToast('Impossible de charger l\'avis'); }
    finally { setDrawerLoading(false); }
  }, [handleReviewDetail]);

  const onExport = useCallback(async () => {
    try {
      const res = await handleExport('csv');
      trackReviewEvent('review_exported', { filename: res.filename });
      setToast(`Export — ${res.filename} (${res.count} lignes)`);
    } catch { setToast('Export impossible'); }
  }, [handleExport]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={() => refresh()} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-800">
        Module en lecture seule. Connectez le backend avant activation des actions sensibles.
      </div>
      <ReviewsHeader search={search} onSearchChange={setSearch} onRefresh={() => refresh()} onExport={onExport} />
      <ReviewsFilters typeFilter={typeFilter} statusFilter={statusFilter} channelFilter={channelFilter} cityFilter={cityFilter} partnerFilter={partnerFilter} driverFilter={driverFilter} onFilter={onFilter} />
      {kpis && <ReviewsKpiCards kpis={kpis} />}
      {reviews.length === 0 ? <EmptyState /> : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <ReviewsTrendChart data={trends} days={days} onDaysChange={(d) => refresh(d)} />
              <ReviewsTable reviews={filtered} onView={openReview} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TopPartnersTable partners={topPartners} />
                <TopDriversTable drivers={topDrivers} />
              </div>
              <IssuesTable issues={issues} />
            </div>
            <div className="space-y-6">
              <RatingDistributionChart data={ratingDistribution} total={kpis?.totalReviews ?? 0} />
              <ChannelDistributionChart channels={channels} />
              <ReviewTypeChart types={reviewTypes} />
              <SentimentAnalysis data={sentiment} />
              <ActionsPanel onExport={onExport} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <NegativeReviewsQueue items={negativeQueue} />
            <AiInsightsPanel insights={insights} />
            <WordCloudPanel words={wordCloud} />
          </div>
          <AgentPerformanceTable agents={agents} />
        </>
      )}
      {(detail || drawerLoading) && (
        <ReviewDetailDrawer
          review={detail}
          loading={drawerLoading && !detail}
          onClose={() => setDetail(null)}
          onReply={async (c) => { if (!detail) return; try { await handleReply(detail.id, c); setToast('Réponse envoyée'); } catch { setToast('Réponse impossible'); } }}
          onEscalate={async () => { if (!detail) return; try { await handleEscalate(detail.id); setToast('Enquête ouverte'); setDetail(null); refresh(); } catch { setToast('Action impossible'); } }}
          onReport={async () => { if (!detail) return; try { await handleReport(detail.id); setToast('Avis signalé'); } catch { setToast('Action impossible'); } }}
        />
      )}
      {toast && <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm shadow-lg">{toast}</div>}
    </div>
  );
};
