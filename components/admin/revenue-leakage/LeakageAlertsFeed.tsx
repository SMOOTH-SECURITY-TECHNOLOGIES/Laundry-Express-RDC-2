import { Icon } from '../../Icon';
import type { LeakageAlert } from '../../../lib/admin/revenue-leakage-types';

const sevStyle = (s: string) =>
  s === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-700' :
  s === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 text-orange-700' :
  'bg-blue-50 dark:bg-blue-900/20 border-blue-200 text-blue-700';

export function LeakageAlertsFeed({ alerts, onInvestigate }: { alerts: LeakageAlert[]; onInvestigate: (id: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="bell" className="w-5 h-5 text-orange-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Alert Center</h3></div>
        <span className="text-xs font-bold text-orange-600">{alerts.length}</span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.map((a) => (
          <button key={a.id} type="button" onClick={() => a.caseId && onInvestigate(a.caseId)} className={`w-full text-left rounded-xl border px-3 py-2 ${sevStyle(a.severity)}`}>
            <p className="text-xs font-medium">{a.message}</p>
            <p className="text-[10px] opacity-70 mt-0.5">{a.time}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
