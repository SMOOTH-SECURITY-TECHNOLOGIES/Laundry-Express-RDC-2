import { Icon } from '../../Icon';
import type { ReferralKpis } from '../../../lib/admin/referrals-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 50; const h = 20;
  const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

function fmt(v: number, suffix = '%') {
  const sign = v >= 0 ? '+' : '';
  return `${sign}${Number.isFinite(v) ? v : 0}${suffix}`;
}

export function ReferralKpiCards({ kpis }: { kpis: ReferralKpis }) {
  const cards = [
    { label: 'Utilisateurs avec code', value: kpis.usersWithCode.toLocaleString('fr-FR'), change: fmt(kpis.usersWithCodeChange), icon: 'users' as const, color: '#2563EB', bg: 'bg-blue-100 dark:bg-blue-900/30', tc: 'text-blue-600', spark: kpis.usersWithCodeSparkline },
    { label: 'Utilisateurs parrainés', value: kpis.referredUsers.toLocaleString('fr-FR'), change: fmt(kpis.referredUsersChange), icon: 'plus' as const, color: '#9333EA', bg: 'bg-violet-100 dark:bg-violet-900/30', tc: 'text-violet-600', spark: kpis.referredUsersSparkline },
    { label: 'Réductions utilisées', value: kpis.discountsUsed.toLocaleString('fr-FR'), change: fmt(kpis.discountsUsedChange), icon: 'gift' as const, color: '#F59E0B', bg: 'bg-orange-100 dark:bg-orange-900/30', tc: 'text-orange-600', spark: kpis.discountsUsedSparkline },
    { label: 'Points bonus attribués', value: kpis.bonusPoints.toLocaleString('fr-FR'), change: fmt(kpis.bonusPointsChange), icon: 'currencyDollar' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600', spark: kpis.bonusPointsSparkline },
    { label: 'Conversions complètes', value: kpis.completedConversions.toLocaleString('fr-FR'), change: fmt(kpis.completedConversionsChange), icon: 'badge-check' as const, color: '#3B82F6', bg: 'bg-blue-100 dark:bg-blue-900/30', tc: 'text-blue-600', spark: kpis.completedConversionsSparkline },
    { label: 'Revenus générés', value: `${kpis.revenueGenerated.toLocaleString('fr-FR')} $`, change: fmt(kpis.revenueGeneratedChange, ' pts'), icon: 'wallet' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600', spark: kpis.revenueGeneratedSparkline },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
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
