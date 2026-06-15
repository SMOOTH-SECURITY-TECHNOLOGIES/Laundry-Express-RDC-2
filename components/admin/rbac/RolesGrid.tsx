import type { RbacRole } from '../../../lib/admin/rbac-types';
import { RBAC_WRITE_ENABLED } from '../../../lib/admin/rbac-api';

export function RolesGrid({ roles, onAction }: { roles: RbacRole[]; onAction: (action: string, role: RbacRole) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {roles.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl border shadow-sm p-4 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold">{r.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{r.description}</p>
            </div>
            {r.isSystem && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Système</span>}
          </div>
          <div className="flex gap-4 text-xs text-gray-600 my-3">
            <span><strong>{r.userCount}</strong> <span className="text-gray-400">utilisateurs</span></span>
            <span><strong>{r.permissionsCount}</strong> <span className="text-gray-400">permissions</span></span>
          </div>
          {r.createdAtLabel && <p className="text-[10px] text-gray-400 mb-3">Créé {r.createdAtLabel}</p>}
          <div className="mt-auto flex flex-wrap gap-1">
            {['Modifier', 'Dupliquer', 'Archiver', 'Supprimer'].map((a) => (
              <button key={a} type="button" disabled={!RBAC_WRITE_ENABLED} onClick={() => onAction(a, r)} className="text-[10px] px-2 py-1 border rounded-lg disabled:opacity-40">{a}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
