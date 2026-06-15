import { Icon } from '../../Icon';
import type { CommissionTimelineStep } from '../../../lib/admin/commissions-types';

export function CommissionTimeline({ steps }: { steps: CommissionTimelineStep[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="clock-history" className="w-5 h-5 text-gray-700 dark:text-slate-300" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Commission Timeline</h3></div>
      <div className="relative pl-6 space-y-4">
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-slate-700" />
        {steps.map((s, i) => (
          <div key={s.id} className="relative flex items-start gap-3">
            <span className={`absolute -left-4 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${s.status === 'done' ? 'bg-green-500' : s.status === 'blocked' ? 'bg-red-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-900 dark:text-slate-100">{s.label}</p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400">{s.timestamp}</p>
            </div>
            {i === steps.length - 1 && s.status === 'pending' && <span className="text-[9px] text-orange-500 font-medium">En attente</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
