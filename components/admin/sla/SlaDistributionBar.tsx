import type { SlaDistribution } from '../../../lib/admin/sla-types';

export function SlaDistributionBar({ data }: { data: SlaDistribution }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Distribution du SLA</h3>
      <div className="w-full h-6 rounded-full overflow-hidden flex mb-3">
        <div className="bg-green-500 h-full" style={{ width: `${data.inSlaPercent}%` }} />
        <div className="bg-orange-500 h-full" style={{ width: `${data.atRiskPercent}%` }} />
        <div className="bg-red-500 h-full" style={{ width: `${data.breachedPercent}%` }} />
      </div>
      <div className="flex flex-wrap justify-between text-xs text-gray-600">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> {data.inSlaPercent}% Dans SLA ({data.inSlaCount})</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> {data.atRiskPercent}% À risque ({data.atRiskCount})</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> {data.breachedPercent}% Dépassé ({data.breachedCount})</span>
      </div>
    </div>
  );
}
