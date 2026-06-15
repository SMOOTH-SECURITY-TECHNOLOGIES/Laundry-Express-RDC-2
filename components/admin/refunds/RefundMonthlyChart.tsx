import { Icon } from '../../Icon';
import type { RefundMonthlyPoint } from '../../../lib/admin/refunds-types';

export function RefundMonthlyChart({ data }: { data: RefundMonthlyPoint[] }) {
  const max = Math.max(...data.flatMap((d) => [d.count, d.refunded, d.refused]));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="chartBar" className="w-5 h-5 text-gray-700 dark:text-slate-300" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Évolution des remboursements</h3></div>
      <div className="flex items-end gap-2 h-28">
        {data.map((p) => (
          <div key={p.label} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex gap-0.5 items-end" style={{ height: '100%' }}>
              <div className="flex-1 bg-blue-500 rounded-t-sm" style={{ height: `${(p.count / max) * 100}%`, minHeight: 2 }} title={`${p.count} remb.`} />
              <div className="flex-1 bg-green-500 rounded-t-sm" style={{ height: `${(p.refunded / max) * 100}%`, minHeight: 2 }} title={`${p.refunded} $`} />
              <div className="flex-1 bg-red-400 rounded-t-sm" style={{ height: `${(p.refused / max) * 100}%`, minHeight: 2 }} title={`${p.refused} $ refusé`} />
            </div>
            <span className="text-[8px] text-gray-400">{p.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-sm" /> Nombre</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-sm" /> Remboursé</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-sm" /> Refusé</span>
      </div>
    </div>
  );
}
