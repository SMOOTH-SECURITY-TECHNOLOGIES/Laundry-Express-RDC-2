import { Icon } from '../../Icon';
import type { SlaDriverPerformance } from '../../../lib/admin/sla-types';

export function SlaDriverRanking({ drivers }: { drivers: SlaDriverPerformance[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="truck" className="w-5 h-5 text-gray-700" /><h3 className="text-sm font-semibold text-gray-900">Performance chauffeurs</h3></div>
        <button type="button" className="text-xs text-blue-600 font-medium">Voir tout →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-gray-500 border-b">
            <th className="pb-2 font-medium">Nom</th><th className="pb-2 font-medium">SLA</th><th className="pb-2 font-medium">ETA</th>
            <th className="pb-2 font-medium">Missions</th><th className="pb-2 font-medium">Retards</th><th className="pb-2 font-medium">Note</th>
          </tr></thead>
          <tbody>
            {drivers.map((d, i) => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5 font-medium text-gray-900">{i + 1}. {d.name}</td>
                <td className="py-2.5 font-semibold text-green-600">{d.slaPercent}%</td>
                <td className="py-2.5 text-gray-600">{d.etaMinutes} min</td>
                <td className="py-2.5 text-gray-600">{d.missions}</td>
                <td className="py-2.5 text-gray-600">{d.delays}</td>
                <td className="py-2.5 text-amber-500">★ {d.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
