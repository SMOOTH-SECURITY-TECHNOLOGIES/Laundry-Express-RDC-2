import { Icon } from '../../Icon';
import type { LoyaltyKpis } from '../../../lib/admin/loyalty-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 50; const h = 20;
  const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

function fmt(v: number, suffix = '%') {
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v}${suffix}`;
}

export function LoyaltyKpiCards({ kpis }: { kpis: LoyaltyKpis }) {
  const cards = [
    { label: 'Membres fidélité', value: kpis.members.toLocaleString('fr-FR'), change: fmt(kpis.membersChange), icon: 'users' as const, color: '#2563EB', bg: 'bg-blue-100 dark:bg-blue-900/30', tc: 'text-blue-600', spark: kpis.membersSparkline },
    { label: 'Points en circulation', value: kpis.pointsCirculation.toLocaleString('fr-FR'), change: fmt(kpis.pointsCirculationChange), icon: 'currencyDollar' as const, color: '#9333EA', bg: 'bg-violet-100 dark:bg-violet-900/30', tc: 'text-violet-600', spark: kpis.pointsCirculationSparkline },
    { label: 'Points gagnés', value: kpis.pointsEarned.toLocaleString('fr-FR'), change: fmt(kpis.pointsEarnedChange), icon: 'plus' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600', spark: kpis.pointsEarnedSparkline },
    { label: 'Points utilisés', value: kpis.pointsRedeemed.toLocaleString('fr-FR'), change: fmt(kpis.pointsRedeemedChange), icon: 'minus' as const, color: '#F59E0B', bg: 'bg-orange-100 dark:bg-orange-900/30', tc: 'text-orange-600', spark: kpis.pointsRedeemedSparkline },
    { label: 'Valeur points', value: `${kpis.pointsValue.toLocaleString('fr-FR')} $`, change: fmt(kpis.pointsValueChange), icon: 'wallet' as const, color: '#3B82F6', bg: 'bg-blue-100 dark:bg-blue-900/30', tc: 'text-blue-600', spark: kpis.pointsValueSparkline },
    { label: 'Taux redemption', value: `${kpis.redemptionRate}%`, change: fmt(kpis.redemptionRateChange, ' pts'), icon: 'chartBar' as const, color: '#EF4444', bg: 'bg-red-100 dark:bg-red-900/30', tc: 'text-red-600', spark: kpis.redemptionRateSparkline },
    { label: 'Revenus influencés', value: `${kpis.influencedRevenue.toLocaleString('fr-FR')} $`, change: fmt(kpis.influencedRevenueChange), icon: 'currencyDollar' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600', spark: kpis.influencedRevenueSparkline },
    { label: 'Rétention membres', value: `${kpis.retentionRate}%`, change: fmt(kpis.retentionRateChange, ' pts'), icon: 'arrow-path' as const, color: '#9333EA', bg: 'bg-violet-100 dark:bg-violet-900/30', tc: 'text-violet-600', spark: kpis.retentionRateSparkline },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}><Icon name={c.icon} className={`w-4 h-4 ${c.tc}`} /></div>
            <Spark data={c.spark} color={c.color} />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{c.value}</p>
          <p className="text-[10px] text-gray-500 mt-1">{c.label}</p>
          <span className="inline-block mt-1 text-[10px] font-medium bg-gray-50 dark:bg-slate-800 rounded-full px-2 py-0.5">{c.change}</span>
        </div>
      ))}
    </div>
  );
}
