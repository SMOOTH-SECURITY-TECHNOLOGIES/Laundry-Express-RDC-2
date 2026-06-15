import { Icon } from '../../Icon';
import type { ReviewsKpis } from '../../../lib/admin/reviews-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

export function ReviewsKpiCards({ kpis }: { kpis: ReviewsKpis }) {
  const cards = [
    { label: 'Note moyenne', value: `${kpis.avgRating} / 5`, change: `+${kpis.avgRatingChange}`, icon: 'star' as const, color: '#F59E0B', bg: 'bg-amber-100', tc: 'text-amber-600', spark: kpis.avgRatingSparkline },
    { label: "Nombre d'avis", value: kpis.totalReviews, change: `+${kpis.totalReviewsChange}%`, icon: 'chatBubble' as const, color: '#3B82F6', bg: 'bg-blue-100', tc: 'text-blue-600', spark: kpis.totalReviewsSparkline },
    { label: 'Avis 5 étoiles', value: kpis.fiveStar, change: `+${kpis.fiveStarChange}%`, icon: 'hand-thumb-up' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: kpis.fiveStarSparkline },
    { label: 'Avis 1-2 étoiles', value: kpis.lowStar, change: `${kpis.lowStarChange}%`, icon: 'warning' as const, color: '#EF4444', bg: 'bg-red-100', tc: 'text-red-600', spark: kpis.lowStarSparkline },
    { label: 'Taux réponse', value: `${kpis.responseRate}%`, change: `+${kpis.responseRateChange} pts`, icon: 'badge-check' as const, color: '#06B6D4', bg: 'bg-cyan-100', tc: 'text-cyan-600', spark: kpis.responseRateSparkline },
    { label: 'Avis en attente', value: kpis.pendingReviews, change: `+${kpis.pendingReviewsChange}%`, icon: 'clock' as const, color: '#9333EA', bg: 'bg-violet-100', tc: 'text-violet-600', spark: kpis.pendingReviewsSparkline },
    { label: 'Sentiment positif', value: `${kpis.positiveSentiment}%`, change: `+${kpis.positiveSentimentChange}%`, icon: 'heart' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: kpis.positiveSentimentSparkline },
    { label: 'Risque churn', value: kpis.churnRisk, change: `+${kpis.churnRiskChange}%`, icon: 'fire' as const, color: '#EF4444', bg: 'bg-red-100', tc: 'text-red-600', spark: kpis.churnRiskSparkline },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}><Icon name={c.icon} className={`w-4 h-4 ${c.tc}`} /></div>
            <Spark data={c.spark} color={c.color} />
          </div>
          <p className="text-lg font-bold">{typeof c.value === 'number' ? c.value.toLocaleString('fr-FR') : c.value}</p>
          <p className="text-[10px] text-gray-500 mt-1">{c.label}</p>
          <span className="inline-block mt-1 text-[10px] font-medium bg-gray-50 rounded-full px-2 py-0.5">{c.change}</span>
        </div>
      ))}
    </div>
  );
}
