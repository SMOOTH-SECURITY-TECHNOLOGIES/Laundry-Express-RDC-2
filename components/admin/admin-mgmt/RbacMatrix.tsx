import type { RbacCell } from '../../../lib/admin/admin-mgmt-types';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Admin', finance: 'Finance', support: 'Support',
  marketing: 'Marketing', operations: 'Operations', moderator: 'Modérateur',
};

export function RbacMatrix({ matrix, resources, roleSlugs }: { matrix: RbacCell[]; resources: string[]; roleSlugs: string[] }) {
  const cell = (role: string, resource: string) => matrix.find((c) => c.roleSlug === role && c.resource === resource);
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Matrice des permissions</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr><th className="px-3 py-2 text-left">Rôle</th>{resources.map((r) => <th key={r} className="px-3 py-2 text-center">{r}</th>)}</tr>
          </thead>
          <tbody>{roleSlugs.map((role) => (
            <tr key={role} className="border-t">
              <td className="px-3 py-2 font-medium whitespace-nowrap">{ROLE_LABELS[role] || role}</td>
              {resources.map((res) => {
                const c = cell(role, res);
                const ok = c && (c.canView || c.canCreate || c.canUpdate || c.canDelete || c.canExport);
                return <td key={res} className="px-3 py-2 text-center">{ok ? <span className="text-green-600">✓</span> : <span className="text-gray-300">—</span>}</td>;
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
