import type { RbacUserAssignment } from '../../../lib/admin/rbac-types';
import { RBAC_WRITE_ENABLED } from '../../../lib/admin/rbac-api';

export function UsersAssignmentsTable({ users, onAction }: { users: RbacUserAssignment[]; onAction: (action: string, user: RbacUserAssignment) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Affectation utilisateurs</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Nom</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Rôle</th>
              <th className="px-4 py-2 text-left">Permissions perso.</th>
              <th className="px-4 py-2 text-left">Dernière connexion</th>
              <th className="px-4 py-2 text-left">2FA</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>{users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="px-4 py-2 font-medium">{u.name}</td>
              <td className="px-4 py-2 text-gray-600">{u.email}</td>
              <td className="px-4 py-2"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{u.roleLabel}</span></td>
              <td className="px-4 py-2 text-xs text-gray-500">{u.customPermissions.length ? u.customPermissions.join(', ') : '—'}</td>
              <td className="px-4 py-2 text-xs text-gray-500">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('fr-FR') : '—'}</td>
              <td className="px-4 py-2">{u.twoFaEnabled ? <span className="text-green-600 text-xs">Actif</span> : <span className="text-red-500 text-xs">Inactif</span>}</td>
              <td className="px-4 py-2">
                <div className="flex gap-1">
                  {['Changer rôle', 'Exception', 'Suspendre'].map((a) => (
                    <button key={a} type="button" disabled={!RBAC_WRITE_ENABLED} onClick={() => onAction(a, u)} className="text-[10px] px-2 py-1 border rounded-lg disabled:opacity-40">{a}</button>
                  ))}
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
