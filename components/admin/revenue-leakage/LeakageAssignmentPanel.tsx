import { Icon } from '../../Icon';
import type { LeakageCaseAssignment, LeakageAssignee } from '../../../lib/admin/revenue-leakage-types';

const statusBadge = (s: string) =>
  s === 'resolved' ? 'bg-green-100 text-green-700' :
  s === 'investigating' ? 'bg-blue-100 text-blue-700' :
  s === 'ignored' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700';

export function LeakageAssignmentPanel({ assignments, onAssign }: {
  assignments: LeakageCaseAssignment[];
  onAssign: (caseId: string, assignee: LeakageAssignee) => void;
}) {
  const teams: LeakageAssignee[] = ['Finance', 'Support', 'Ops', 'Admin'];
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="users" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Assignation des cas</h3></div>
      <div className="space-y-2">
        {assignments.map((a) => (
          <div key={a.caseId} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 dark:border-slate-700 p-3 text-xs">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-slate-100 truncate">{a.title}</p>
              <p className="text-gray-500">{a.caseId} — {a.amount} $</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(a.status)}`}>{a.status}</span>
            <select value={a.assignee} onChange={(e) => onAssign(a.caseId, e.target.value as LeakageAssignee)} className="text-[10px] rounded-lg border px-2 py-1 dark:bg-slate-800">
              {teams.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
