import { Icon } from '../../Icon';
import type { PaymentZoneStats } from '../../../lib/admin/payments-types';

export function PaymentsZoneChart({ zones }: { zones: PaymentZoneStats[] }) {
  const max = Math.max(...zones.map((z) => z.revenue));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="map" className="w-5 h-5 text-gray-700 dark:text-slate-300" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Paiements par zone</h3></div>
      <div className="space-y-2">
        {zones.map((z) => (
          <div key={z.id} className="flex items-center gap-3">
            <span className="w-20 text-xs font-medium text-gray-700 dark:text-slate-300 truncate">{z.name}</span>
            <div className="flex-1 h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(z.revenue / max) * 100}%`, backgroundColor: z.healthColor }} />
            </div>
            <span className="text-xs font-semibold text-gray-900 dark:text-slate-100 w-16 text-right">{z.revenue.toLocaleString('fr-FR')} $</span>
            <span className="text-[10px] text-gray-400 w-12">{z.transactions} tx</span>
          </div>
        ))}
      </div>
    </div>
  );
}
