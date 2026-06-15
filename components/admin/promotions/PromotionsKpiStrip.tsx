import { Icon } from '../../Icon';
import type { PromoKpis } from '../../../lib/admin/promotions-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

export function PromotionsKpiStrip({ kpis }: { kpis: PromoKpis }) {
  const cards = [
    { label: 'Promotions actives', value: String(kpis.activePromotions), change: `+${kpis.activeChange}%`, icon: 'gift' as const, color: '#2563EB', bg: 'bg-blue-100 dark:bg-blue-900/30', tc: 'text-blue-600', spark: [18, 19, 20, 21, 22, 23, 24] },
    { label: 'Utilisations', value: kpis.usages.toLocaleString('fr-FR'), change: `+${kpis.usagesChange}%`, icon: 'list' as const, color: '#9333EA', bg: 'bg-violet-100 dark:bg-violet-900/30', tc: 'text-violet-600', spark: [3800, 4000, 4200, 4400, 4600, 4700, 4820] },
    { label: 'Revenus générés', value: `${kpis.revenueGenerated.toLocaleString('fr-FR')} $`, change: `+${kpis.revenueChange}%`, icon: 'currencyDollar' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600', spark: [32000, 35000, 37000, 39000, 40000, 41500, 42500] },
    { label: 'ROI moyen', value: `${kpis.avgRoi}x`, change: `+${kpis.roiChange}%`, icon: 'chartBar' as const, color: '#F59E0B', bg: 'bg-orange-100 dark:bg-orange-900/30', tc: 'text-orange-600', spark: [4.2, 4.6, 5.0, 5.2, 5.4, 5.6, 5.8] },
    { label: 'Clients réactivés', value: String(kpis.reactivatedClients), change: `+${kpis.reactivatedChange}%`, icon: 'arrow-path' as const, color: '#3B82F6', bg: 'bg-blue-100 dark:bg-blue-900/30', tc: 'text-blue-600', spark: [220, 240, 260, 275, 290, 300, 312] },
    { label: 'Taux conversion promo', value: `${kpis.conversionRate}%`, change: `+${kpis.conversionChange}%`, icon: 'check' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600', spark: [14, 15, 16, 16.5, 17, 17.8, 18.4] },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 hover:scale-[1.01] transition-transform">
          <div className="flex items-start justify-between mb-2">
            <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}><Icon name={c.icon} className={`w-4 h-4 ${c.tc}`} /></div>
            <Spark data={c.spark} color={c.color} />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{c.value}</p>
          <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">{c.label}</p>
          <span className="inline-block mt-1 text-[10px] font-medium text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 rounded-full px-2 py-0.5">{c.change}</span>
        </div>
      ))}
    </div>
  );
}
