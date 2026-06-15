import type { AdminInvitation } from '../../../lib/admin/admin-mgmt-types';
import { ADMIN_MGMT_WRITE_ENABLED } from '../../../lib/admin/admin-mgmt-api';

export function InvitationsTable({ invitations, onAction }: { invitations: AdminInvitation[]; onAction: (a: string, i: AdminInvitation) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Invitations en attente</h3></div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Rôle</th><th className="px-4 py-3">Invité par</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Expiration</th><th className="px-4 py-3">Actions</th></tr></thead>
        <tbody>{invitations.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucune invitation en attente</td></tr> : invitations.map((i) => (
          <tr key={i.id} className="border-t">
            <td className="px-4 py-3">{i.email}</td>
            <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{i.roleLabel}</span></td>
            <td className="px-4 py-3">{i.invitedBy || '—'}</td>
            <td className="px-4 py-3 text-xs">{i.createdAt ? new Date(i.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
            <td className="px-4 py-3 text-xs">{i.expiresAt ? new Date(i.expiresAt).toLocaleDateString('fr-FR') : '—'}</td>
            <td className="px-4 py-3 text-xs flex gap-2">
              <button type="button" disabled={!ADMIN_MGMT_WRITE_ENABLED} onClick={() => onAction('resend', i)} className="text-blue-600 disabled:opacity-50">Relancer</button>
              <button type="button" disabled={!ADMIN_MGMT_WRITE_ENABLED} onClick={() => onAction('cancel', i)} className="text-red-600 disabled:opacity-50">Annuler</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
