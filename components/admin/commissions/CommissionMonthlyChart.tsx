import { Icon } from '../../Icon';
import type { CommissionMonthlyPoint } from '../../../lib/admin/commissions-types';

export function CommissionMonthlyChart({ data }: { data: CommissionMonthlyPoint[] }) {
  const max = Math.max(...data.flatMap((d) => [d.generated, d.paid, d.due]));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="chartBar" className="w-5 h-5 text-gray-700 dark:text-slate-300" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Évolution mensuelle</h3>
      </div>
      <div className="flex items-end gap-2 h-32">
        {data.map((p) => (
          <div key={p.label} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex gap-0.5 items-end" style={{ height: '100%' }}>
              <div className="flex-1 bg-blue-500 rounded-t-sm" style={{ height: `${(p.generated / max) * 100}%`, minHeight: 2 }} title={`Générées ${p.generated}`} />
              <div className="flex-1 bg-green-500 rounded-t-sm" style={{ height: `${(p.paid / max) * 100}%`, minHeight: 2 }} title={`Payées ${p.paid}`} />
              <div className="flex-1 bg-orange-400 rounded-t-sm" style={{ height: `${(p.due / max) * 100}%`, minHeight: 2 }} title={`Dues ${p.due}`} />
            </div>
            <span className="text-[8px] text-gray-400">{p.label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-sm" /> Générées</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-sm" /> Payées</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-400 rounded-sm" /> Dues</span>
      </div>
    </div>
  );
}
