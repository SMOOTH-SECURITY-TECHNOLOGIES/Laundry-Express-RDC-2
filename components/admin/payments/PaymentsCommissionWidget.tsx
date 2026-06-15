import { Icon } from '../../Icon';
import type { CommissionWidget } from '../../../lib/admin/payments-types';

export function PaymentsCommissionWidget({ data, onDrillDown }: { data: CommissionWidget; onDrillDown: () => void }) {
  const items = [
    { label: 'Générées', value: data.generated, color: 'text-blue-600' },
    { label: 'Payées', value: data.paid, color: 'text-green-600' },
    { label: 'En attente', value: data.pending, color: 'text-orange-600' },
    { label: 'Bloquées', value: data.blocked, color: 'text-red-600' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="currencyDollar" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Commissions</h3></div>
        <button type="button" onClick={onDrillDown} className="text-xs text-blue-600 font-medium">Voir →</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((i) => (
          <div key={i.label} className="rounded-xl bg-gray-50 dark:bg-slate-800 p-3 text-center">
            <p className={`text-lg font-bold ${i.color}`}>{i.value.toLocaleString('fr-FR')} $</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400">{i.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
