import type { FinanceDashboard } from '../../../lib/admin/finance-types';

export function FinanceTrendCard({ dashboard }: { dashboard: FinanceDashboard }) {
  const pts = dashboard.trendSparkline;
  const w = 220; const h = 70;
  const max = Math.max(...pts); const min = Math.min(...pts); const r = max - min || 1;
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * w} ${h - ((p - min) / r) * (h - 10)}`).join(' ');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-100 dark:border-blue-900/40 shadow-sm p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900">
      <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">Tendance Revenus</p>
      <div className="flex items-end justify-between gap-4 mt-2">
        <div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-slate-100">+{dashboard.trendPercent}%</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">vs période précédente</p>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-48 max-w-full" aria-hidden="true">
          <path d={`M0 ${h - 5} H${w}`} stroke="#dbeafe" strokeWidth="1" />
          <path d={path} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
