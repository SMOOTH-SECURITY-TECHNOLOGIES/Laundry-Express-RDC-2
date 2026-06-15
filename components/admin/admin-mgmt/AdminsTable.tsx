import type { AdminMgmtUser } from '../../../lib/admin/admin-mgmt-types';
import { ADMIN_MGMT_WRITE_ENABLED } from '../../../lib/admin/admin-mgmt-api';

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700', admin: 'bg-blue-100 text-blue-700', finance: 'bg-green-100 text-green-700',
  support: 'bg-amber-100 text-amber-700', marketing: 'bg-pink-100 text-pink-700', operations: 'bg-cyan-100 text-cyan-700', moderator: 'bg-gray-100 text-gray-700',
};

export function AdminsTable({ admins, onAction }: { admins: AdminMgmtUser[]; onAction: (a: string, u: AdminMgmtUser) => void }) {
  if (!admins.length) return <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">Aucun administrateur trouvé.</div>;
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Admins existants</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr><th className="px-4 py-3">Admin</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Téléphone</th><th className="px-4 py-3">Rôle</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Dernière connexion</th><th className="px-4 py-3">2FA</th><th className="px-4 py-3">Actions</th></tr>
          </thead>
          <tbody>{admins.map((a) => (
            <tr key={a.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">{a.name.charAt(0)}</div><span className="font-medium">{a.name}</span></div></td>
              <td className="px-4 py-3">{a.email}</td>
              <td className="px-4 py-3 text-gray-500">{a.phone || '—'}</td>
              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${roleColors[a.roleSlug] || ''}`}>{a.roleLabel}</span></td>
              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{a.statusLabel}</span></td>
              <td className="px-4 py-3 text-xs">{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString('fr-FR') : '—'}</td>
              <td className="px-4 py-3 text-xs">{a.twoFaEnabled ? <span className="text-green-600">Activé</span> : <span className="text-gray-400">Non</span>}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1 text-xs">
                  <button type="button" onClick={() => onAction('view', a)} className="text-blue-600">Voir</button>
                  <button type="button" disabled={!ADMIN_MGMT_WRITE_ENABLED} onClick={() => onAction('edit', a)} className="text-violet-600 disabled:opacity-50">Modifier</button>
                  <button type="button" disabled={!ADMIN_MGMT_WRITE_ENABLED} onClick={() => onAction('suspend', a)} className="text-amber-600 disabled:opacity-50">Suspendre</button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
