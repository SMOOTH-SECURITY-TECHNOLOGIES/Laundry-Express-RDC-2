import { Icon } from '../../Icon';
import type { CommissionLeakageItem } from '../../../lib/admin/commissions-types';

export function CommissionLeakageCenter({ items, onInvestigate }: { items: CommissionLeakageItem[]; onInvestigate: (id: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1"><Icon name="exclamation-circle" className="w-5 h-5 text-red-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Commission Leakage</h3></div>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Fuites et anomalies de commission détectées</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => onInvestigate(item.id)} className={`text-left rounded-xl border ${item.border} dark:border-slate-700 border-l-4 p-4 hover:shadow-md transition-shadow`} style={{ borderLeftColor: item.color }}>
            <div className="flex items-center justify-between">
              <span className={`p-2 rounded-lg ${item.bg}`}><Icon name="warning" className="w-5 h-5" /></span>
              <span className="text-2xl font-bold" style={{ color: item.color }}>{item.count}</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-slate-100 mt-3">{item.label}</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">{item.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
