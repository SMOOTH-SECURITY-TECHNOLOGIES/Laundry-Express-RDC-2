import { Icon } from '../../Icon';
import type { CommissionRevenueVsCommission } from '../../../lib/admin/commissions-types';

export function CommissionRevenueVsChart({ data }: { data: CommissionRevenueVsCommission[] }) {
  const max = Math.max(...data.flatMap((d) => [d.revenue, d.commission]));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="chartBar" className="w-5 h-5 text-gray-700 dark:text-slate-300" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Revenus vs commissions</h3></div>
      <div className="flex items-end gap-2 h-28">
        {data.map((p) => (
          <div key={p.label} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex gap-0.5 items-end" style={{ height: '100%' }}>
              <div className="flex-1 bg-slate-400 rounded-t-sm" style={{ height: `${(p.revenue / max) * 100}%`, minHeight: 2 }} title={`Revenu ${p.revenue}`} />
              <div className="flex-1 bg-purple-500 rounded-t-sm" style={{ height: `${(p.commission / max) * 100}%`, minHeight: 2 }} title={`Commission ${p.commission}`} />
            </div>
            <span className="text-[8px] text-gray-400">{p.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-400 rounded-sm" /> Revenus</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-sm" /> Commissions</span>
      </div>
    </div>
  );
}
