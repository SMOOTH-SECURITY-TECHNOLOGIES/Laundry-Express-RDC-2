import { Icon } from '../../Icon';
import type { FraudDetectionItem } from '../../../lib/admin/refunds-types';

const riskStyle: Record<string, string> = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export function RefundFraudDetection({ items, onInvestigate }: { items: FraudDetectionItem[]; onInvestigate: (id: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="warning" className="w-5 h-5 text-red-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Fraud Detection</h3></div>
      <div className="space-y-2">
        {items.map((f) => (
          <button key={f.id} type="button" onClick={() => onInvestigate(f.id)} className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left">
            <div><p className="text-xs font-medium text-gray-900 dark:text-slate-100">{f.label}</p><p className="text-[10px] text-gray-500 dark:text-slate-400">{f.count} détection{f.count > 1 ? 's' : ''}</p></div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${riskStyle[f.riskLevel]}`}>{f.riskLevel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
