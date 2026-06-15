import { Icon } from '../../Icon';
import type { UserActivity } from '../../../lib/admin/users-types';

export function RecentActivityCard({ activity }: { activity: UserActivity[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="clock" className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold">Activité récente</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-gray-500">
            <tr>
              <th className="text-left py-2">Utilisateur</th>
              <th className="text-left py-2">Action</th>
              <th className="text-left py-2">Détail</th>
              <th className="text-left py-2">Appareil</th>
              <th className="text-right py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {activity.slice(0, 5).map((a) => (
              <tr key={a.id} className="border-t border-gray-100">
                <td className="py-2 font-medium">{a.userName}</td>
                <td className="py-2">{a.action}</td>
                <td className="py-2 text-gray-500">{a.detail}</td>
                <td className="py-2 text-gray-500">{a.device}</td>
                <td className="py-2 text-right text-gray-400">{a.date ? new Date(a.date).toLocaleString('fr-FR') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
