import { Icon } from '../../Icon';
import type { RefundWidget } from '../../../lib/admin/payments-types';

export function PaymentsRefundWidget({ data, onOpenRefunds }: { data: RefundWidget; onOpenRefunds: () => void }) {
  const items = [
    { label: 'Demandes', value: data.requests },
    { label: 'Acceptées', value: data.accepted },
    { label: 'Rejetées', value: data.rejected },
    { label: 'En attente', value: data.pending },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="arrow-path" className="w-5 h-5 text-orange-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Remboursements</h3></div>
        <button type="button" onClick={onOpenRefunds} className="text-xs text-blue-600 font-medium">Module →</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((i) => (
          <div key={i.label} className="rounded-xl bg-gray-50 dark:bg-slate-800 p-3 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{i.value}</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400">{i.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
