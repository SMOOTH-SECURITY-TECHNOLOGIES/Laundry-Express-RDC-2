import { Icon } from '../../Icon';
import type { DailyRevenueSummary } from '../../../lib/admin/finance-types';

export function FinanceDailyChart({ data }: { data: DailyRevenueSummary }) {
  const max = Math.max(...data.points.map((p) => p.amount));
  const visible = data.points.slice(-7);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="chartBar" className="w-5 h-5 text-gray-700 dark:text-slate-300" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Revenus par jour</h3>
        <span className="text-[10px] text-gray-400">30 derniers jours</span>
      </div>
      <div className="flex items-end gap-1.5 h-36 mb-4">
        {visible.map((p) => (
          <div key={p.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600 transition-colors" style={{ height: `${(p.amount / max) * 100}%`, minHeight: 4 }} title={`${p.amount} $`} />
            <span className="text-[8px] text-gray-400">{p.date}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total revenus', value: `${data.totalRevenue.toLocaleString('fr-FR')} $` },
          { label: 'Total commandes', value: String(data.totalOrders) },
          { label: 'Panier moyen', value: `${data.avgBasket.toFixed(2)} $` },
          { label: 'Croissance', value: `+${data.growthPercent}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-gray-50 dark:bg-slate-800 p-3 text-center">
            <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{s.value}</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
