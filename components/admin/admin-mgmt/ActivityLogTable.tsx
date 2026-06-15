import type { ActivityLog } from '../../../lib/admin/admin-mgmt-types';

export function ActivityLogTable({ logs }: { logs: ActivityLog[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Admin Activity Log</h3></div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Utilisateur</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Objet</th><th className="px-4 py-3">IP</th><th className="px-4 py-3">Résultat</th></tr></thead>
        <tbody>{logs.map((l) => (
          <tr key={l.id} className="border-t">
            <td className="px-4 py-3 text-xs">{l.occurredAt ? new Date(l.occurredAt).toLocaleString('fr-FR') : '—'}</td>
            <td className="px-4 py-3">{l.actorName}</td><td className="px-4 py-3">{l.actionLabel}</td>
            <td className="px-4 py-3 text-gray-500">{l.target || '—'}</td><td className="px-4 py-3 font-mono text-xs">{l.ipAddress || '—'}</td>
            <td className="px-4 py-3"><span className={l.result === 'success' ? 'text-green-600' : 'text-red-600'}>{l.resultLabel}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
