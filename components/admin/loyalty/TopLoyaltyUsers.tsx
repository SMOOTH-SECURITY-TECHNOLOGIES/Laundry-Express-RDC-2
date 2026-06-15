import { Icon } from '../../Icon';
import type { TopLoyaltyUser } from '../../../lib/admin/loyalty-types';

export function TopLoyaltyUsers({ users }: { users: TopLoyaltyUser[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="trophy" className="w-5 h-5 text-yellow-500" /><h3 className="text-sm font-semibold">Top loyalty users</h3></div>
      <table className="w-full text-xs">
        <thead><tr className="text-[10px] text-gray-500 uppercase border-b"><th className="text-left py-2">#</th><th className="text-left py-2">Client</th><th className="text-right py-2">Points</th><th className="text-right py-2">Valeur</th><th className="text-right py-2">Cmd.</th></tr></thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.userId} className="border-b border-gray-50 dark:border-slate-800">
              <td className="py-2">{i + 1}</td>
              <td className="py-2"><div className="font-medium">{u.name}</div><div className="text-gray-500">{u.email}</div></td>
              <td className="py-2 text-right font-bold">{u.points.toLocaleString('fr-FR')}</td>
              <td className="py-2 text-right text-green-600">{u.estimatedValue} $</td>
              <td className="py-2 text-right">{u.ordersCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
