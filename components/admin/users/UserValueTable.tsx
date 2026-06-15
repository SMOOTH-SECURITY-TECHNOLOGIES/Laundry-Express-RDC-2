import { Icon } from '../../Icon';
import type { ValueUser } from '../../../lib/admin/users-types';

export function UserValueTable({ users }: { users: ValueUser[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="currencyDollar" className="w-5 h-5 text-green-600" />
        <h3 className="text-sm font-semibold">Analyse valeur client</h3>
      </div>
      <table className="w-full text-xs">
        <thead className="text-gray-500">
          <tr>
            <th className="text-left py-2">Utilisateur</th>
            <th className="text-right py-2">CLV</th>
            <th className="text-right py-2">Panier moyen</th>
            <th className="text-right py-2">Fréquence</th>
            <th className="text-right py-2">Dernière commande</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.userId} className="border-t border-gray-100">
              <td className="py-2 font-medium">{u.name}</td>
              <td className="py-2 text-right font-semibold text-green-600">{u.clv.toLocaleString('fr-FR')} $</td>
              <td className="py-2 text-right">{u.avgBasket.toLocaleString('fr-FR')} $</td>
              <td className="py-2 text-right">{u.frequency}/mois</td>
              <td className="py-2 text-right text-gray-400">{u.lastOrder ? new Date(u.lastOrder).toLocaleDateString('fr-FR') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
