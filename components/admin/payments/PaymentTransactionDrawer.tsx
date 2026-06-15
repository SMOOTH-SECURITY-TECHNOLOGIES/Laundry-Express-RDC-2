import { Icon } from '../../Icon';
import type { PaymentTransactionDetail } from '../../../lib/admin/payments-types';

export function PaymentTransactionDrawer({ detail, onClose, onInvestigate }: { detail: PaymentTransactionDetail | null; onClose: () => void; onInvestigate: (id: string) => void }) {
  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-xl h-full overflow-y-auto border-l dark:border-slate-700">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Transaction {detail.id}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"><Icon name="xmark" className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {[
            { label: 'Commande liée', value: detail.orderId },
            { label: 'Provider', value: detail.provider },
            { label: 'Commission', value: `${detail.commission.toFixed(2)} $` },
            { label: 'Remboursement', value: detail.refundAmount > 0 ? `${detail.refundAmount.toFixed(2)} $` : '—' },
          ].map((f) => (
            <div key={f.label} className="flex justify-between p-3 rounded-xl border border-gray-100 dark:border-slate-700">
              <span className="text-sm text-gray-600 dark:text-slate-400">{f.label}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{f.value}</span>
            </div>
          ))}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Historique complet</h4>
            {detail.history.map((h, i) => (
              <div key={i} className="flex justify-between text-xs py-2 border-b border-gray-50 dark:border-slate-800">
                <span className="text-gray-700 dark:text-slate-300">{h.label}</span>
                <span className="text-gray-500">{h.timestamp}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => onInvestigate(detail.id)} className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">Investiguer</button>
        </div>
      </div>
    </div>
  );
}
