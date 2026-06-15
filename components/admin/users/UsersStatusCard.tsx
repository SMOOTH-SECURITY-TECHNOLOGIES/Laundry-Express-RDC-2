import { Icon } from '../../Icon';
import type { StatusBreakdown } from '../../../lib/admin/users-types';

const COLORS: Record<string, string> = {
  Actifs: 'bg-green-500', Inactifs: 'bg-orange-500', 'En attente': 'bg-yellow-500', Suspendus: 'bg-red-500',
};

export function UsersStatusCard({ data }: { data: StatusBreakdown[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="shield" className="w-5 h-5 text-green-600" />
        <h3 className="text-sm font-semibold">Statut des utilisateurs</h3>
      </div>
      <div className="space-y-3">
        {data.map((s) => (
          <div key={s.status}>
            <div className="flex justify-between text-xs mb-1">
              <span>{s.status}</span>
              <span className="text-gray-500">{s.count} ({s.percent}%)</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${COLORS[s.status] ?? 'bg-gray-400'}`} style={{ width: `${s.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
