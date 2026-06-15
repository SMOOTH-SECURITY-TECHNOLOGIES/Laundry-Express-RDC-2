import type { AuditLog } from '../../../lib/admin/admin-mgmt-types';

export function AuditTrailPanel({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
      <h3 className="font-semibold">Admin Audit Trail</h3>
      <p className="text-xs text-gray-500">Journal immuable — ancien état / nouvel état / acteur / date</p>
      {logs.map((l) => (
        <div key={l.id} className="border rounded-xl p-4 text-sm">
          <div className="flex justify-between mb-2">
            <span className="font-medium">{l.actorName}</span>
            <span className="text-xs text-gray-400">{l.occurredAt ? new Date(l.occurredAt).toLocaleString('fr-FR') : '—'}</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">{l.resourceType} {l.resourceId && `· ${l.resourceId}`}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {l.oldState && <pre className="bg-red-50 p-2 rounded overflow-x-auto">{JSON.stringify(l.oldState, null, 2)}</pre>}
            {l.newState && <pre className="bg-green-50 p-2 rounded overflow-x-auto">{JSON.stringify(l.newState, null, 2)}</pre>}
          </div>
        </div>
      ))}
    </div>
  );
}
