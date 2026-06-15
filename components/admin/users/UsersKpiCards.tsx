import { Icon } from '../../Icon';
import type { UserKpis } from '../../../lib/admin/users-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 50; const h = 20;
  const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

function fmt(v: number) {
  const sign = v >= 0 ? '+' : '';
  return `${sign}${Number.isFinite(v) ? v : 0}%`;
}

export function UsersKpiCards({ kpis }: { kpis: UserKpis }) {
  const cards = [
    { label: 'Utilisateurs totaux', value: kpis.totalUsers, change: fmt(kpis.totalUsersChange), icon: 'users' as const, color: '#2563EB', bg: 'bg-blue-100', tc: 'text-blue-600', spark: kpis.totalUsersSparkline },
    { label: 'Nouveaux inscrits', value: kpis.newSignups, change: fmt(kpis.newSignupsChange), icon: 'plus' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: kpis.newSignupsSparkline },
    { label: 'Utilisateurs actifs', value: kpis.activeUsers, change: fmt(kpis.activeUsersChange), icon: 'badge-check' as const, color: '#9333EA', bg: 'bg-violet-100', tc: 'text-violet-600', spark: kpis.activeUsersSparkline },
    { label: 'Utilisateurs inactifs', value: kpis.inactiveUsers, change: fmt(kpis.inactiveUsersChange), icon: 'user' as const, color: '#F59E0B', bg: 'bg-orange-100', tc: 'text-orange-600', spark: kpis.inactiveUsersSparkline },
    { label: 'Partenaires', value: kpis.partners, change: fmt(kpis.partnersChange), icon: 'building' as const, color: '#06B6D4', bg: 'bg-cyan-100', tc: 'text-cyan-600', spark: kpis.partnersSparkline },
    { label: 'Chauffeurs', value: kpis.drivers, change: fmt(kpis.driversChange), icon: 'truck' as const, color: '#EC4899', bg: 'bg-pink-100', tc: 'text-pink-600', spark: kpis.driversSparkline },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4">
          <div className="flex items-start justify-between mb-2">
            <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}><Icon name={c.icon} className={`w-4 h-4 ${c.tc}`} /></div>
            <Spark data={c.spark} color={c.color} />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{c.value.toLocaleString('fr-FR')}</p>
          <p className="text-[10px] text-gray-500 mt-1">{c.label}</p>
          <span className="inline-block mt-1 text-[10px] font-medium bg-gray-50 dark:bg-slate-800 rounded-full px-2 py-0.5">{c.change}</span>
        </div>
      ))}
    </div>
  );
}
