import type { AdminMgmtRole } from '../../../lib/admin/admin-mgmt-types';
import { ADMIN_MGMT_WRITE_ENABLED } from '../../../lib/admin/admin-mgmt-api';

export function RolesGrid({ roles, onAction }: { roles: AdminMgmtRole[]; onAction: (a: string, r: AdminMgmtRole) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {roles.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl border shadow-sm p-5">
          <h4 className="font-semibold">{r.name}</h4>
          <p className="text-xs text-gray-500 mt-1">{r.description}</p>
          <div className="flex gap-4 mt-3 text-sm">
            <span><strong>{r.userCount}</strong> <span className="text-gray-400 text-xs">utilisateurs</span></span>
            <span><strong>{r.permissionsCount}</strong> <span className="text-gray-400 text-xs">permissions</span></span>
          </div>
          {r.createdAtLabel && <p className="text-xs text-gray-400 mt-2">Créé {r.createdAtLabel}</p>}
          <div className="flex gap-2 mt-3 text-xs">
            <button type="button" disabled={!ADMIN_MGMT_WRITE_ENABLED} onClick={() => onAction('edit', r)} className="text-blue-600 disabled:opacity-50">Modifier</button>
            <button type="button" disabled={!ADMIN_MGMT_WRITE_ENABLED} onClick={() => onAction('duplicate', r)} className="text-violet-600 disabled:opacity-50">Dupliquer</button>
          </div>
        </div>
      ))}
    </div>
  );
}
