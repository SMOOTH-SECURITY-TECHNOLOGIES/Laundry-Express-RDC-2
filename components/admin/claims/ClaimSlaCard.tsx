import type { ClaimSlaPanel } from '../../../lib/admin/claims-types';

export function ClaimSlaCard({ sla }: { sla: ClaimSlaPanel }) {
  const total = sla.inSla + sla.atRisk + sla.breached || 1;
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">SLA Center</h3>
      <div className="text-center mb-4">
        <span className="text-3xl font-bold">{sla.compliancePercent}%</span>
        <p className="text-xs text-gray-500">conformité SLA</p>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-green-600">Dans SLA</span><span>{sla.inSla} ({Math.round(sla.inSla / total * 100)}%)</span></div>
        <div className="flex justify-between"><span className="text-amber-600">À risque</span><span>{sla.atRisk} ({Math.round(sla.atRisk / total * 100)}%)</span></div>
        <div className="flex justify-between"><span className="text-red-600">Hors SLA</span><span>{sla.breached} ({Math.round(sla.breached / total * 100)}%)</span></div>
      </div>
      {sla.byCategory.length > 0 && (
        <div className="mt-4 space-y-2">
          {sla.byCategory.slice(0, 5).map((c) => (
            <div key={c.category} className="text-xs">
              <div className="flex justify-between mb-1"><span>{c.category}</span></div>
              <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                <div className="bg-green-500" style={{ width: `${((c.in_sla as number) || 0) * 10}%` }} />
                <div className="bg-amber-500" style={{ width: `${((c.at_risk as number) || 0) * 10}%` }} />
                <div className="bg-red-500" style={{ width: `${((c.breached as number) || 0) * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
