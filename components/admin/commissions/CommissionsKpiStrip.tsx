import { Icon } from '../../Icon';
import type { CommissionKpis } from '../../../lib/admin/commissions-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

export function CommissionsKpiStrip({ kpis }: { kpis: CommissionKpis }) {
  const cards = [
    { label: 'Commissions générées', value: `${kpis.generated.toLocaleString('fr-FR')} $`, sub: `+${kpis.generatedChange}%`, icon: 'currencyDollar' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600 dark:text-green-400', spark: [42000, 44000, 46000, 48000, 50000, 51200, 52450] },
    { label: 'Commissions dues', value: `${kpis.due.toLocaleString('fr-FR')} $`, sub: `+${kpis.dueChange}%`, icon: 'wallet' as const, color: '#F59E0B', bg: 'bg-orange-100 dark:bg-orange-900/30', tc: 'text-orange-600 dark:text-orange-400', spark: [4200, 4400, 4600, 4800, 5000, 5120, 5240] },
    { label: 'Commissions payées', value: `${kpis.paid.toLocaleString('fr-FR')} $`, sub: `+${kpis.paidChange}%`, icon: 'shield-check' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600 dark:text-green-400', spark: [15000, 16000, 16800, 17500, 18000, 18500, 18900] },
    { label: 'Commissions en litige', value: `${kpis.disputed.toLocaleString('fr-FR')} $`, sub: `+${kpis.disputedChange}%`, icon: 'warning' as const, color: '#EF4444', bg: 'bg-red-100 dark:bg-red-900/30', tc: 'text-red-600 dark:text-red-400', spark: [900, 1000, 1050, 1100, 1150, 1200, 1250] },
    { label: 'Commissions manquantes', value: String(kpis.missing), sub: `${kpis.missingChange}`, icon: 'exclamation-circle' as const, color: '#EF4444', bg: 'bg-red-100 dark:bg-red-900/30', tc: 'text-red-600 dark:text-red-400', spark: [6, 5, 5, 4, 4, 4, 4] },
    { label: 'Taux de collecte', value: `${kpis.collectionRate}%`, sub: `+${kpis.collectionRateChange}%`, icon: 'chartBar' as const, color: '#2563EB', bg: 'bg-blue-100 dark:bg-blue-900/30', tc: 'text-blue-600 dark:text-blue-400', spark: [86, 88, 90, 91, 92, 93, 94] },
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
          <span className="inline-block mt-1 text-[10px] font-medium text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 rounded-full px-2 py-0.5">{c.sub}</span>
        </div>
      ))}
    </div>
  );
}
