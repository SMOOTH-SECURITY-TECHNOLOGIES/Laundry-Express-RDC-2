import { Icon } from '../../Icon';
import type { Zone } from '../../../lib/admin/zones-types';

export function ZoneProfitabilityTable({ zones }: { zones: Zone[] }) {
  const active = zones.filter((z) => z.status !== 'inactive');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Icon name="currencyDollar" className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">Rentabilité par zone</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">CA</th>
              <th className="px-4 py-3 hidden md:table-cell">Commission</th>
              <th className="px-4 py-3">Livraisons</th>
              <th className="px-4 py-3 hidden sm:table-cell">Profit</th>
              <th className="px-4 py-3">Croissance</th>
            </tr>
          </thead>
          <tbody>
            {active.map((z) => (
              <tr key={z.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{z.name}</td>
                <td className="px-4 py-3">{z.performance.revenue.toLocaleString('fr-FR')} $</td>
                <td className="px-4 py-3 hidden md:table-cell">{z.performance.commission.toLocaleString('fr-FR')} $</td>
                <td className="px-4 py-3">{z.performance.deliveries}</td>
                <td className="px-4 py-3 text-green-600 hidden sm:table-cell">{z.performance.profit.toLocaleString('fr-FR')} $</td>
                <td className="px-4 py-3 text-green-600">+{z.performance.growthPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
