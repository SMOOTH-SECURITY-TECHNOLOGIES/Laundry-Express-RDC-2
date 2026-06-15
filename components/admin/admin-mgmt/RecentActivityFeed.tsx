import type { ActivityLog } from '../../../lib/admin/admin-mgmt-types';

export function RecentActivityFeed({ logs }: { logs: ActivityLog[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">Activité récente</h3>
      <div className="space-y-3">{logs.slice(0, 6).map((l) => (
        <div key={l.id} className="flex gap-3 text-sm border-l-2 border-violet-200 pl-3">
          <div><p className="font-medium">{l.actionLabel}</p><p className="text-xs text-gray-500">{l.actorName} · {l.target}</p></div>
          <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">{l.occurredAt ? new Date(l.occurredAt).toLocaleTimeString('fr-FR') : ''}</span>
        </div>
      ))}</div>
    </div>
  );
}
