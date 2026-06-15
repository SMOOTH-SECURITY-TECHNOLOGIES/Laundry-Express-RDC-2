import type { RbacPermission } from '../../../lib/admin/rbac-types';

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700', medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700',
};

export function PermissionsTable({ permissions }: { permissions: RbacPermission[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Permissions granulaires</h3></div>
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left">Permission</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Module</th>
              <th className="px-4 py-2 text-left">Niveau risque</th>
            </tr>
          </thead>
          <tbody>{permissions.map((p) => (
            <tr key={p.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2 font-mono text-xs">{p.slug}</td>
              <td className="px-4 py-2 text-gray-600">{p.description || p.label}</td>
              <td className="px-4 py-2">{p.module}</td>
              <td className="px-4 py-2"><span className={`text-[10px] px-2 py-0.5 rounded-full ${RISK_COLORS[p.riskLevel] || 'bg-gray-100'}`}>{p.riskLabel}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
