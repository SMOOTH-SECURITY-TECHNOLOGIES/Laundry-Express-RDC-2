import { Icon } from '../../Icon';
import type { ZoneKpis } from '../../../lib/admin/zones-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 60; const h = 24; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" /></svg>;
}

export function ZoneKpiCards({ kpis }: { kpis: ZoneKpis }) {
  const cards = [
    { label: 'Zones actives', value: String(kpis.activeZones), sub: `${kpis.activePercent}% réseau`, icon: 'map' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', ch: '+2', spark: [10, 10, 11, 11, 12, 12, 12, 12, kpis.activeZones] },
    { label: 'Zones à risque', value: String(kpis.atRiskZones), sub: `+${kpis.atRiskChange} vs mois précédent`, icon: 'warning' as const, color: '#F59E0B', bg: 'bg-orange-100', tc: 'text-orange-600', ch: `+${kpis.atRiskChange}`, spark: [1, 1, 2, 2, 2, 2, 2, 2, kpis.atRiskZones] },
    { label: 'Commandes / jour', value: String(kpis.ordersPerDay), sub: `+${kpis.ordersChange}%`, icon: 'shoppingBag' as const, color: '#9333EA', bg: 'bg-violet-100', tc: 'text-violet-600', ch: `+${kpis.ordersChange}%`, spark: [700, 740, 760, 780, 800, 820, 830, 840, kpis.ordersPerDay] },
    { label: 'Revenus / jour', value: `${kpis.revenuePerDay.toLocaleString('fr-FR')} $`, sub: `+${kpis.revenueChange}%`, icon: 'currencyDollar' as const, color: '#22C55E', bg: 'bg-emerald-100', tc: 'text-emerald-600', ch: `+${kpis.revenueChange}%`, spark: [3500, 3700, 3900, 4000, 4100, 4150, 4200, 4240, kpis.revenuePerDay] },
    { label: 'Délai moyen', value: `${kpis.avgDeliveryMinutes} min`, sub: `${kpis.deliveryChange}%`, icon: 'clock' as const, color: '#2563EB', bg: 'bg-blue-100', tc: 'text-blue-600', ch: `${kpis.deliveryChange}%`, spark: [38, 36, 35, 34, 33, 32, 32, 32, kpis.avgDeliveryMinutes] },
    { label: 'SLA global', value: `${kpis.globalSla}%`, sub: `+${kpis.slaChange}%`, icon: 'shield-check' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', ch: `+${kpis.slaChange}%`, spark: [88, 90, 91, 92, 93, 93, 94, 94, kpis.globalSla] },
    { label: 'Zones saturées', value: String(kpis.saturatedZones), sub: 'Capacité dépassée', icon: 'exclamation-circle' as const, color: '#EF4444', bg: 'bg-red-100', tc: 'text-red-600', ch: '-1', spark: [2, 2, 2, 1, 1, 1, 1, 1, kpis.saturatedZones] },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:scale-[1.01] transition-transform">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-full ${c.bg} flex items-center justify-center`}><Icon name={c.icon} className={`w-5 h-5 ${c.tc}`} /></div>
            <Spark data={c.spark} color={c.color} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{c.value}</p>
          <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          <span className="inline-block mt-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-full px-2 py-0.5">{c.sub}</span>
        </div>
      ))}
    </div>
  );
}
