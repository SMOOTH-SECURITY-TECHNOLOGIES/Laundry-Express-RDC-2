import type { RoleDistribution } from '../../../lib/admin/admin-mgmt-types';

export function RoleDistributionChart({ data, total }: { data: RoleDistribution[]; total: number }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">Répartition par rôle</h3>
      <div className="flex flex-wrap gap-3 mb-4">{data.map((d) => (
        <div key={d.roleSlug} className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
          <span>{d.roleLabel}</span><span className="text-gray-400">{d.percent}%</span>
        </div>
      ))}</div>
      <p className="text-center text-2xl font-bold">{total}</p>
      <p className="text-center text-xs text-gray-400">Total admins</p>
    </div>
  );
}
