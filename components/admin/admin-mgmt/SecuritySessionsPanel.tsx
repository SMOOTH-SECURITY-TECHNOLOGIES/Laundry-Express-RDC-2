import type { AdminSession, SecuritySummary } from '../../../lib/admin/admin-mgmt-types';
import { ADMIN_MGMT_WRITE_ENABLED } from '../../../lib/admin/admin-mgmt-api';

export function SecuritySessionsPanel({ security, sessions, onAction }: {
  security: SecuritySummary; sessions: AdminSession[]; onAction: (a: string, s: AdminSession) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border p-4"><p className="text-xl font-bold">{security.activeSessions}</p><p className="text-xs text-gray-500">Sessions actives</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-xl font-bold">{security.logins24h}</p><p className="text-xs text-gray-500">Connexions (24h)</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-xl font-bold text-red-600">{security.loginFailures}</p><p className="text-xs text-gray-500">Échecs login</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-xl font-bold text-green-600">{security.twoFaPct}%</p><p className="text-xs text-gray-500">2FA activé</p></div>
      </div>
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-semibold">Sécurité & Sessions</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-3">Utilisateur</th><th className="px-4 py-3">IP</th><th className="px-4 py-3">Ville</th><th className="px-4 py-3">Appareil</th><th className="px-4 py-3">Navigateur</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody>{sessions.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="px-4 py-3">{s.userName}</td><td className="px-4 py-3 font-mono text-xs">{s.ipAddress}</td>
              <td className="px-4 py-3">{s.city}</td><td className="px-4 py-3 text-xs">{s.device}</td><td className="px-4 py-3 text-xs">{s.browser}</td>
              <td className="px-4 py-3 text-xs">
                <button type="button" disabled={!ADMIN_MGMT_WRITE_ENABLED} onClick={() => onAction('logout', s)} className="text-red-600 disabled:opacity-50">Forcer déconnexion</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
