import { Icon } from '../../Icon';
import type { FailedTransaction } from '../../../lib/admin/payments-types';

export function PaymentsFailedCard({ failed, onRetry, onInvestigate }: { failed: FailedTransaction[]; onRetry: (id: string) => void; onInvestigate: (id: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="xmark" className="w-5 h-5 text-red-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Transactions échouées ({failed.length})</h3></div>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {failed.map((f) => (
          <div key={f.id} className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-slate-100">{f.id} — {f.orderId}</p>
                <p className="text-[10px] text-red-600 mt-0.5">{f.error}</p>
                <p className="text-[10px] text-gray-400">{f.time} · {f.amount.toFixed(2)} $</p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => onRetry(f.id)} className="px-2 py-1 rounded-lg bg-orange-100 text-orange-700 text-[10px] font-medium">Relancer</button>
                <button type="button" onClick={() => onInvestigate(f.id)} className="px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-[10px] font-medium">Investiguer</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
