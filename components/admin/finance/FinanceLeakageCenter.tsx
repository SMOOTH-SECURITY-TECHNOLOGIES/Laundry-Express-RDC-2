import { Icon } from '../../Icon';
import type { LeakageItem } from '../../../lib/admin/finance-types';

const iconMap: Record<string, 'credit-card' | 'document-text' | 'warning' | 'currencyDollar'> = {
  orphan_payment: 'credit-card',
  unbilled_pickup: 'document-text',
  suspicious_refund: 'warning',
  missing_commission: 'currencyDollar',
};

export function FinanceLeakageCenter({ items, onViewDetails }: { items: LeakageItem[]; onViewDetails: (id: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="exclamation-circle" className="w-5 h-5 text-gray-700 dark:text-slate-300" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Revenue Leakage</h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Sources de pertes ou risques financiers détectés</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className={`rounded-xl border ${item.border} dark:border-slate-700 border-l-4 p-4`} style={{ borderLeftColor: item.color }}>
            <div className="flex items-center justify-between">
              <span className={`p-2 rounded-lg ${item.bg}`}>
                <Icon name={iconMap[item.type] ?? 'warning'} className="w-5 h-5" />
              </span>
              <span className="text-2xl font-bold" style={{ color: item.color }}>{item.count}</span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-slate-100 mt-3">{item.label}</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">{item.description}</p>
            <button type="button" onClick={() => onViewDetails(item.id)} className="mt-3 text-xs text-blue-600 font-medium hover:text-blue-800">Voir détails</button>
          </div>
        ))}
      </div>
    </div>
  );
}
