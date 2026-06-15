import type { RbacSecurityPolicy } from '../../../lib/admin/rbac-types';
import { RBAC_WRITE_ENABLED } from '../../../lib/admin/rbac-api';

export function SecurityPoliciesPanel({ policies }: { policies: RbacSecurityPolicy[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Politiques de sécurité</h3></div>
      <div className="divide-y">
        {policies.map((p) => (
          <div key={p.policyKey} className="px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">{p.policyLabel}</p>
              {p.policyValue && <p className="text-xs text-gray-500 font-mono">{p.policyValue}</p>}
            </div>
            <button type="button" disabled={!RBAC_WRITE_ENABLED} className={`text-xs px-3 py-1 rounded-full ${p.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {p.enabled ? 'ON' : 'OFF'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
