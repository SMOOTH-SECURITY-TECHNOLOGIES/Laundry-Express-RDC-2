import { Icon } from '../../Icon';
import type { SlaKpis } from '../../../lib/admin/sla-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

export function SlaKpiCards({ kpis }: { kpis: SlaKpis }) {
  const cards = [
    { label: 'SLA Global', value: `${kpis.globalSla}%`, sub: `+${kpis.globalSlaChange}%`, icon: 'shield-check' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: [88, 90, 91, 92, 93, 93, 94, 94, kpis.globalSla] },
    { label: 'Commandes sous SLA', value: String(kpis.ordersInSla), sub: `+${kpis.ordersInSlaChange}%`, icon: 'check' as const, color: '#2563EB', bg: 'bg-blue-100', tc: 'text-blue-600', spark: [1050, 1080, 1100, 1120, 1140, 1160, 1170, 1180, kpis.ordersInSla] },
    { label: 'Commandes à risque', value: String(kpis.ordersAtRisk), sub: `+${kpis.ordersAtRiskChange}`, icon: 'warning' as const, color: '#F59E0B', bg: 'bg-orange-100', tc: 'text-orange-600', spark: [8, 9, 10, 10, 11, 11, 12, 12, kpis.ordersAtRisk] },
    { label: 'Commandes dépassées', value: String(kpis.ordersBreached), sub: `${kpis.ordersBreachedChange}`, icon: 'exclamation-circle' as const, color: '#EF4444', bg: 'bg-red-100', tc: 'text-red-600', spark: [5, 4, 4, 3, 3, 3, 3, 3, kpis.ordersBreached] },
    { label: 'Temps moyen livraison', value: `${kpis.avgDeliveryMinutes} min`, sub: `${kpis.avgDeliveryChange} min`, icon: 'truck' as const, color: '#2563EB', bg: 'bg-blue-100', tc: 'text-blue-600', spark: [36, 35, 34, 33, 33, 32, 32, 32, kpis.avgDeliveryMinutes] },
    { label: 'ETA moyen', value: `${kpis.avgEtaMinutes} min`, sub: `${kpis.avgEtaChange} min`, icon: 'clock' as const, color: '#9333EA', bg: 'bg-violet-100', tc: 'text-violet-600', spark: [32, 31, 30, 29, 29, 28, 28, 28, kpis.avgEtaMinutes] },
    { label: 'Incidents SLA', value: String(kpis.slaIncidents), sub: `+${kpis.slaIncidentsChange}`, icon: 'warning' as const, color: '#EF4444', bg: 'bg-red-100', tc: 'text-red-600', spark: [4, 5, 5, 6, 6, 7, 7, 7, kpis.slaIncidents] },
    { label: 'Coût SLA (mois)', value: `${kpis.slaCostMonth.toLocaleString('fr-FR')} $`, sub: `${kpis.slaCostChange}%`, icon: 'currencyDollar' as const, color: '#22C55E', bg: 'bg-emerald-100', tc: 'text-emerald-600', spark: [1400, 1350, 1320, 1300, 1280, 1260, 1250, 1240, kpis.slaCostMonth] },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:scale-[1.01] transition-transform">
          <div className="flex items-start justify-between mb-2">
            <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}><Icon name={c.icon} className={`w-4 h-4 ${c.tc}`} /></div>
            <Spark data={c.spark} color={c.color} />
          </div>
          <p className="text-xl font-bold text-gray-900">{c.value}</p>
          <p className="text-[10px] text-gray-500 mt-1">{c.label}</p>
          <span className="inline-block mt-1 text-[10px] font-medium text-gray-600 bg-gray-50 rounded-full px-2 py-0.5">{c.sub}</span>
        </div>
      ))}
    </div>
  );
}
