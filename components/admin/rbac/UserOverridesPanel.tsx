import type { RbacUserOverride } from '../../../lib/admin/rbac-types';

const GRANT_COLORS: Record<string, string> = {
  inherited: 'bg-gray-100 text-gray-600', custom: 'bg-violet-100 text-violet-700', temporary: 'bg-amber-100 text-amber-700',
};

export function UserOverridesPanel({ overrides }: { overrides: RbacUserOverride[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Permissions individuelles</h3></div>
      <div className="divide-y">
        {overrides.map((o) => (
          <div key={o.id} className="px-4 py-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">{o.userName}</p>
                <p className="text-xs text-gray-500">Rôle: {o.roleSlug} · <span className="font-mono">{o.permissionSlug}</span></p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${GRANT_COLORS[o.grantType] || 'bg-gray-100'}`}>{o.grantTypeLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
