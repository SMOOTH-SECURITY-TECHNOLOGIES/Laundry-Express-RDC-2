import { Icon } from '../../Icon';
import type { FinanceDashboard } from '../../../lib/admin/finance-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

export function FinanceKpiGrid({ dashboard }: { dashboard: FinanceDashboard }) {
  const cards = [
    { label: "Revenu aujourd'hui", value: `${dashboard.todayRevenue.toLocaleString('fr-FR')} $`, sub: `+${dashboard.todayChange}%`, icon: 'currencyDollar' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600 dark:text-green-400', spark: [1500, 1600, 1700, 1750, 1800, 1820, 1850] },
    { label: 'Revenu semaine', value: `${dashboard.weekRevenue.toLocaleString('fr-FR')} $`, sub: `+${dashboard.weekChange}%`, icon: 'chartBar' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600 dark:text-green-400', spark: [9000, 9500, 10000, 10400, 10700, 10900, 11000] },
    { label: 'Revenu mois', value: `${dashboard.monthRevenue.toLocaleString('fr-FR')} $`, sub: `+${dashboard.monthChange}%`, icon: 'chartBar' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600 dark:text-green-400', spark: [36000, 38000, 39500, 40500, 41500, 42200, 42750] },
    { label: 'Commissions dues', value: `${dashboard.commissionDue.toLocaleString('fr-FR')} $`, sub: 'à payer', icon: 'wallet' as const, color: '#F59E0B', bg: 'bg-orange-100 dark:bg-orange-900/30', tc: 'text-orange-600 dark:text-orange-400', spark: [4800, 4900, 5000, 5100, 5150, 5200, 5240] },
    { label: 'Commissions payées', value: `${dashboard.commissionPaid.toLocaleString('fr-FR')} $`, sub: 'ce mois', icon: 'shield-check' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600 dark:text-green-400', spark: [17000, 17500, 18000, 18300, 18600, 18800, 18900] },
    { label: 'Cash en transit', value: `${dashboard.cashInTransit.toLocaleString('fr-FR')} $`, sub: 'chauffeurs', icon: 'truck' as const, color: '#F59E0B', bg: 'bg-orange-100 dark:bg-orange-900/30', tc: 'text-orange-600 dark:text-orange-400', spark: [2100, 2200, 2300, 2350, 2400, 2440, 2460] },
    { label: 'Marge brute', value: `${dashboard.grossMargin} %`, sub: 'du revenu total', icon: 'chartBar' as const, color: '#9333EA', bg: 'bg-violet-100 dark:bg-violet-900/30', tc: 'text-violet-600 dark:text-violet-400', spark: [54, 55, 56, 57, 58, 58.5, 58.7] },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 hover:scale-[1.01] transition-transform">
          <div className="flex items-start justify-between mb-2">
            <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}><Icon name={c.icon} className={`w-4 h-4 ${c.tc}`} /></div>
            <Spark data={c.spark} color={c.color} />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{c.value}</p>
          <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">{c.label}</p>
          <span className="inline-block mt-1 text-[10px] font-medium text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 rounded-full px-2 py-0.5">{c.sub}</span>
        </div>
      ))}
    </div>
  );
}
