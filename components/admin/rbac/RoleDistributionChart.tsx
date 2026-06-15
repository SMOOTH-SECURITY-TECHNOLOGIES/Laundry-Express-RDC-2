import type { RoleDistribution } from '../../../lib/admin/rbac-types';

export function RoleDistributionChart({ data, total }: { data: RoleDistribution[]; total: number }) {
  const size = 120; const r = 45; const cx = 60; const cy = 60;
  let offset = 0;
  const arcs = data.map((d) => {
    const pct = total ? d.count / total : 0;
    const dash = pct * 2 * Math.PI * r;
    const gap = 2 * Math.PI * r;
    const arc = { ...d, dash, gap, offset };
    offset += dash;
    return arc;
  });

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-4">
      <h3 className="font-semibold mb-4">Répartition des rôles</h3>
      <div className="flex items-center gap-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="12" />
          {arcs.map((a) => (
            <circle key={a.roleSlug} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth="12"
              strokeDasharray={`${a.dash} ${a.gap}`} strokeDashoffset={-a.offset + Math.PI * r / 2}
              transform={`rotate(-90 ${cx} ${cy})`} />
          ))}
        </svg>
        <div className="space-y-1 text-xs flex-1">
          {data.slice(0, 6).map((d) => (
            <div key={d.roleSlug} className="flex justify-between">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.roleLabel}</span>
              <span className="text-gray-500">{d.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
