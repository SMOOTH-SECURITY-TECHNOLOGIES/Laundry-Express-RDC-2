import type { RbacTenant } from '../../../lib/admin/rbac-types';

export function TenantsPanel({ tenants }: { tenants: RbacTenant[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Multi-tenant</h3><p className="text-xs text-gray-500">Permissions isolées — aucun accès cross-tenant</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
        {tenants.map((t) => (
          <div key={t.id} className="border rounded-xl p-3">
            <p className="font-medium text-sm">{t.name}</p>
            <p className="text-xs text-gray-500 mt-1">{t.userCount} utilisateurs · {t.roleCount} rôles</p>
            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full mt-2 inline-block">{t.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
