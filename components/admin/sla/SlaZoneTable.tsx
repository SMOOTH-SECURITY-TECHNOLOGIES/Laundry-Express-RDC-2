import type { SlaZonePerformance } from '../../../lib/admin/sla-types';

const trendIcon = (t: string) => t === 'up' ? '↑' : t === 'down' ? '↓' : '→';
const trendColor = (t: string) => t === 'up' ? 'text-green-600' : t === 'down' ? 'text-red-600' : 'text-gray-500';

export function SlaZoneTable({ zones }: { zones: SlaZonePerformance[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Performance par zone</h3>
        <button type="button" className="text-xs text-blue-600 font-medium">Voir tout →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-gray-500 border-b">
            <th className="pb-2 font-medium">Zone</th><th className="pb-2 font-medium">SLA</th><th className="pb-2 font-medium">ETA</th>
            <th className="pb-2 font-medium">Volume</th><th className="pb-2 font-medium">Incidents</th><th className="pb-2 font-medium">Tendance</th>
          </tr></thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5 font-medium text-gray-900">{z.name}</td>
                <td className="py-2.5"><span className="font-semibold" style={{ color: z.healthColor }}>{z.slaPercent}%</span></td>
                <td className="py-2.5 text-gray-600">{z.etaMinutes} min</td>
                <td className="py-2.5 text-gray-600">{z.volume}</td>
                <td className="py-2.5 text-gray-600">{z.incidents}</td>
                <td className={`py-2.5 font-bold ${trendColor(z.trend)}`}>{trendIcon(z.trend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
