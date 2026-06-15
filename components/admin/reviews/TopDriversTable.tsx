import { Icon } from '../../Icon';
import type { TopDriver } from '../../../lib/admin/reviews-types';

export function TopDriversTable({ drivers }: { drivers: TopDriver[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="truck" className="w-5 h-5 text-green-600" /><h3 className="text-sm font-semibold">Top chauffeurs</h3></div>
      <table className="w-full text-xs"><thead className="text-gray-500"><tr><th className="text-left py-2">Chauffeur</th><th className="text-right py-2">Note</th><th className="text-right py-2">Avis</th></tr></thead>
        <tbody>{drivers.slice(0, 10).map((d) => <tr key={d.driverId} className="border-t"><td className="py-2">{d.driverName}</td><td className="py-2 text-right text-amber-600">★ {d.avgRating}</td><td className="py-2 text-right">{d.reviewCount}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
