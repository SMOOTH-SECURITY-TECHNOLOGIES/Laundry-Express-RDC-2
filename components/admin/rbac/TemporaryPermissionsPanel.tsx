import type { RbacTemporaryPermission } from '../../../lib/admin/rbac-types';

export function TemporaryPermissionsPanel({ items }: { items: RbacTemporaryPermission[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Permissions temporaires</h3></div>
      <div className="divide-y">
        {items.length === 0 && <p className="px-4 py-6 text-sm text-gray-500 text-center">Aucune permission temporaire active.</p>}
        {items.map((t) => (
          <div key={t.id} className="px-4 py-3">
            <p className="text-sm font-medium">{t.userName}</p>
            <p className="text-xs font-mono text-gray-600">{t.permissionLabel}</p>
            <p className="text-xs text-gray-500 mt-1">Accordé par {t.grantedBy} · Expire {t.expiresAt ? new Date(t.expiresAt).toLocaleString('fr-FR') : '24h'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
