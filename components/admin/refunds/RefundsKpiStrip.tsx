import { Icon } from '../../Icon';
import type { RefundKpis } from '../../../lib/admin/refunds-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

export function RefundsKpiStrip({ kpis }: { kpis: RefundKpis }) {
  const cards = [
    { label: 'Demandes ouvertes', value: String(kpis.openRequests), sub: `+${kpis.openChange}%`, icon: 'exclamation-circle' as const, color: '#F59E0B', bg: 'bg-orange-100 dark:bg-orange-900/30', tc: 'text-orange-600 dark:text-orange-400', spark: [18, 19, 20, 21, 22, 23, 24] },
    { label: 'En attente', value: String(kpis.pending), sub: `+${kpis.pendingChange}%`, icon: 'clock' as const, color: '#F59E0B', bg: 'bg-orange-100 dark:bg-orange-900/30', tc: 'text-orange-600 dark:text-orange-400', spark: [5, 6, 6, 7, 7, 8, 8] },
    { label: 'Approuvées', value: String(kpis.approved), sub: `+${kpis.approvedChange}%`, icon: 'check' as const, color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', tc: 'text-green-600 dark:text-green-400', spark: [120, 125, 130, 135, 140, 142, 145] },
    { label: 'Rejetées', value: String(kpis.rejected), sub: `${kpis.rejectedChange}%`, icon: 'xmark' as const, color: '#EF4444', bg: 'bg-red-100 dark:bg-red-900/30', tc: 'text-red-600 dark:text-red-400', spark: [15, 14, 14, 13, 13, 12, 12] },
    { label: 'Montant remboursé', value: `${kpis.refundedAmount.toLocaleString('fr-FR')} $`, sub: `+${kpis.refundedChange}%`, icon: 'currencyDollar' as const, color: '#2563EB', bg: 'bg-blue-100 dark:bg-blue-900/30', tc: 'text-blue-600 dark:text-blue-400', spark: [14000, 15000, 16000, 16800, 17500, 18000, 18250] },
    { label: 'Suspicion fraude', value: String(kpis.fraudSuspicion), sub: `+${kpis.fraudChange}%`, icon: 'warning' as const, color: '#EF4444', bg: 'bg-red-100 dark:bg-red-900/30', tc: 'text-red-600 dark:text-red-400', spark: [1, 1, 2, 2, 2, 3, 3] },
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
