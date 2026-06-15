import { Icon } from '../../Icon';
import type { DriverKpis } from '../../../lib/admin/drivers-types';

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const w = 60; const h = 24;
  const max = Math.max(...data); const min = Math.min(...data); const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" /></svg>;
}

export function DriverKpiCards({ kpis }: { kpis: DriverKpis }) {
  const cards = [
    { label: 'Chauffeurs enregistrés', value: String(kpis.registered), change: '+8%', icon: 'users' as const, color: '#6366f1', bg: 'bg-indigo-100', tc: 'text-indigo-600', spark: [28, 29, 30, 31, 31, 32, 32, 32, kpis.registered] },
    { label: 'Disponibles', value: String(kpis.available), change: '+12%', icon: 'badge-check' as const, color: '#22c55e', bg: 'bg-green-100', tc: 'text-green-600', spark: [14, 15, 16, 16, 17, 17, 18, 18, kpis.available] },
    { label: 'En mission', value: String(kpis.onMission), change: '+5%', icon: 'truck' as const, color: '#3b82f6', bg: 'bg-blue-100', tc: 'text-blue-600', spark: [8, 9, 9, 10, 10, 11, 11, 11, kpis.onMission] },
    { label: 'Hors ligne', value: String(kpis.offline), change: '-14%', icon: 'circle' as const, color: '#6b7280', bg: 'bg-gray-100', tc: 'text-gray-600', spark: [5, 5, 4, 4, 4, 3, 3, 3, kpis.offline] },
    { label: 'SLA moyen', value: `${kpis.avgSla}%`, change: '+4%', icon: 'shield-check' as const, color: '#10b981', bg: 'bg-emerald-100', tc: 'text-emerald-600', spark: [88, 90, 91, 92, 93, 93, 94, 94, kpis.avgSla] },
    { label: 'Note moyenne', value: `${kpis.avgRating}/5`, change: '+0.2', icon: 'star' as const, color: '#f59e0b', bg: 'bg-amber-100', tc: 'text-amber-600', spark: [4.4, 4.5, 4.6, 4.6, 4.7, 4.7, 4.8, 4.8, kpis.avgRating * 10] },
    { label: 'Revenus générés', value: `${kpis.totalRevenue.toLocaleString('fr-FR')} $`, change: '+15%', icon: 'currencyDollar' as const, color: '#8b5cf6', bg: 'bg-violet-100', tc: 'text-violet-600', spark: [9000, 9800, 10200, 10800, 11200, 11800, 12200, 12300, kpis.totalRevenue] },
    { label: 'Incidents ouverts', value: String(kpis.openIncidents), change: '-33%', icon: 'warning' as const, color: '#ef4444', bg: 'bg-red-100', tc: 'text-red-600', spark: [5, 4, 4, 3, 3, 3, 2, 2, kpis.openIncidents] },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 transition-transform hover:scale-[1.01]">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-full ${c.bg} flex items-center justify-center`}>
              <Icon name={c.icon} className={`w-5 h-5 ${c.tc}`} />
            </div>
            <MiniSparkline data={c.spark} color={c.color} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{c.value}</p>
          <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          <span className="inline-block mt-2 text-xs font-medium text-green-600 bg-green-50 rounded-full px-2 py-0.5">{c.change}</span>
        </div>
      ))}
    </div>
  );
}
