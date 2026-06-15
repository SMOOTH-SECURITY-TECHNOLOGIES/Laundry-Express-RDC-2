import { Icon } from '../../Icon';
import type { DriverRankingEntry } from '../../../lib/admin/drivers-types';

export function DriverRanking({ ranking }: { ranking: DriverRankingEntry[] }) {
  const top = ranking.slice(0, 10);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Icon name="trophy" className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-900">Performance des chauffeurs</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="px-6 py-3">#</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">SLA</th>
              <th className="px-4 py-3">Avis</th>
              <th className="px-6 py-3">Missions</th>
            </tr>
          </thead>
          <tbody>
            {top.map((d, i) => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{d.name}</td>
                <td className="px-4 py-3 font-bold text-blue-600">{d.score}</td>
                <td className="px-4 py-3 text-green-600">{d.sla}%</td>
                <td className="px-4 py-3 text-amber-500">{d.rating}</td>
                <td className="px-6 py-3 text-gray-600">{d.missions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
