import { Icon } from '../../Icon';
import type { TopUser } from '../../../lib/admin/users-types';

export function TopUsersTable({ users }: { users: TopUser[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="star" className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-semibold">Top utilisateurs</h3>
      </div>
      <table className="w-full text-xs">
        <thead className="text-gray-500">
          <tr>
            <th className="text-left py-2">Utilisateur</th>
            <th className="text-right py-2">Commandes</th>
            <th className="text-right py-2">CA généré</th>
            <th className="text-right py-2">Points</th>
            <th className="text-right py-2">Dernière activité</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.userId} className="border-t border-gray-100">
              <td className="py-2 font-medium">{u.name}</td>
              <td className="py-2 text-right">{u.orders}</td>
              <td className="py-2 text-right">{u.revenue.toLocaleString('fr-FR')} $</td>
              <td className="py-2 text-right text-purple-600">{u.loyaltyPoints.toLocaleString('fr-FR')}</td>
              <td className="py-2 text-right text-gray-400">{u.lastActivity ? new Date(u.lastActivity).toLocaleDateString('fr-FR') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
