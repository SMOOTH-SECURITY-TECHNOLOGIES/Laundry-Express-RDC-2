import { Icon } from '../../Icon';
import type { ReconciliationGap } from '../../../lib/admin/payments-types';

export function PaymentsReconciliation({ gaps, onInvestigate }: { gaps: ReconciliationGap[]; onInvestigate: (id: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="shield-check" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Réconciliation</h3></div>
      <div className="space-y-2">
        {gaps.map((g) => (
          <button key={g.id} type="button" onClick={() => onInvestigate(g.id)} className="w-full flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 hover:shadow-md text-left">
            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-slate-100">{g.label}</p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400">{g.impact}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-orange-600">{g.count}</span>
              <p className="text-[10px] text-gray-500">{g.amount} $</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
