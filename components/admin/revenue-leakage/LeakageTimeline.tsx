import { Icon } from '../../Icon';
import type { LeakageTimelineEvent } from '../../../lib/admin/revenue-leakage-types';

const stages = ['detection', 'investigation', 'assignment', 'correction', 'resolution'] as const;
const labels: Record<string, string> = { detection: 'Détection', investigation: 'Investigation', assignment: 'Assignation', correction: 'Correction', resolution: 'Résolution' };

export function LeakageTimeline({ events }: { events: LeakageTimelineEvent[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="clock" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Revenue Leakage Timeline</h3></div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {stages.map((s, i) => (
          <span key={s} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300">↓</span>}
            <span className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-slate-800 text-[10px] font-medium text-gray-700 dark:text-slate-300">{labels[s]}</span>
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {events.map((e) => (
          <div key={e.id} className="flex items-start gap-3 text-xs border-l-2 border-blue-200 pl-3 py-1">
            <div><p className="font-medium text-gray-900 dark:text-slate-100">{e.label}</p><p className="text-[10px] text-gray-500">{e.time}{e.actor ? ` — ${e.actor}` : ''}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
