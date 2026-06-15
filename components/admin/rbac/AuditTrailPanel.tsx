import type { RbacAuditLog } from '../../../lib/admin/rbac-types';

export function AuditTrailPanel({ logs }: { logs: RbacAuditLog[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Permission Audit Log</h3></div>
      <div className="divide-y max-h-80 overflow-y-auto">
        {logs.map((l) => (
          <div key={l.id} className="px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">{l.actorName}</span>
              <span className="text-xs text-gray-400">{l.occurredAt ? new Date(l.occurredAt).toLocaleString('fr-FR') : ''}</span>
            </div>
            <p className="text-xs font-mono text-gray-600 mt-1">{l.permissionSlug}</p>
            <p className="text-xs text-gray-500 mt-1">{l.oldValue} → {l.newValue} {l.ipAddress && <span className="text-gray-400">· {l.ipAddress}</span>}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
