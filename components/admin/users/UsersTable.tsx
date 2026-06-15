import { Icon } from '../../Icon';
import type { UserSummary } from '../../../lib/admin/users-types';

const ROLE_COLORS: Record<string, string> = {
  Client: 'bg-blue-100 text-blue-700', Partenaire: 'bg-purple-100 text-purple-700',
  Chauffeur: 'bg-green-100 text-green-700', Admin: 'bg-red-100 text-red-700',
  Logistique: 'bg-cyan-100 text-cyan-700', Support: 'bg-amber-100 text-amber-700',
};
const STATUS_COLORS: Record<string, string> = {
  Actif: 'bg-green-100 text-green-700', Inactif: 'bg-orange-100 text-orange-700',
  Suspendu: 'bg-red-100 text-red-700', 'En attente': 'bg-yellow-100 text-yellow-700',
};

interface Props {
  users: UserSummary[];
  onView: (u: UserSummary) => void;
  onSecurity: (u: UserSummary) => void;
}

export function UsersTable({ users, onView, onSecurity }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">Utilisateurs enregistrés ({users.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Utilisateur</th>
              <th className="text-left px-4 py-3 font-medium">Contact</th>
              <th className="text-left px-4 py-3 font-medium">Rôle</th>
              <th className="text-left px-4 py-3 font-medium">Statut</th>
              <th className="text-left px-4 py-3 font-medium">Inscrit le</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">{u.name.slice(0, 2).toUpperCase()}</span>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p>{u.email}</p>
                  <p className="text-gray-400">{u.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ROLE_COLORS[u.roleLabel] ?? 'bg-gray-100 text-gray-700'}`}>{u.roleLabel}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[u.statusLabel] ?? 'bg-gray-100'}`}>{u.statusLabel}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <ActionBtn icon="search" title="Voir" onClick={() => onView(u)} />
                    <ActionBtn icon="pencil" title="Modifier" onClick={() => onView(u)} />
                    <ActionBtn icon="clock" title="Historique" onClick={() => onSecurity(u)} />
                    <ActionBtn icon="bars3" title="Plus" onClick={() => onView(u)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t text-xs text-blue-600 font-medium">Voir tous les utilisateurs →</div>
    </div>
  );
}

function ActionBtn({ icon, title, onClick }: { icon: string; title: string; onClick: () => void }) {
  return (
    <button type="button" title={title} onClick={onClick} className="p-1.5 rounded-lg hover:bg-gray-100">
      <Icon name={icon as 'search'} className="w-3.5 h-3.5 text-gray-500" />
    </button>
  );
}
