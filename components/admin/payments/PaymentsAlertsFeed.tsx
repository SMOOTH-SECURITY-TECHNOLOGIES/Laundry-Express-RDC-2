import { Icon } from '../../Icon';
import type { PaymentAlert } from '../../../lib/admin/payments-types';

const severityStyle = (s: string) =>
  s === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' :
  s === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300' :
  'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';

export function PaymentsAlertsFeed({ alerts, onInvestigate }: { alerts: PaymentAlert[]; onInvestigate: (id: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="bell" className="w-5 h-5 text-red-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Alertes paiements ({alerts.length})</h3><span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 text-[9px] font-bold">LIVE</span></div>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.map((a) => (
          <div key={a.id} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${severityStyle(a.severity)}`}>
            <div className="flex-1"><p className="font-medium">{a.message}</p><p className="text-[10px] opacity-70 mt-0.5">{a.timestamp}{a.amount ? ` · ${a.amount} $` : ''}</p></div>
            {a.investigateId && <button type="button" onClick={() => onInvestigate(a.investigateId!)} className="ml-2 text-[10px] font-medium underline">Enquête</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
