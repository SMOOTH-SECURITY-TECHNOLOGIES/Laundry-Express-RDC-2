import { Icon } from '../../Icon';
import type { TopZone } from '../../../lib/admin/users-types';

export function TopZonesTable({ zones }: { zones: TopZone[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="map" className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold">Top zones</h3>
      </div>
      <table className="w-full text-xs">
        <thead className="text-gray-500">
          <tr><th className="text-left py-2">Zone</th><th className="text-right py-2">Utilisateurs</th><th className="text-right py-2">%</th></tr>
        </thead>
        <tbody>
          {zones.map((z) => (
            <tr key={z.zone} className="border-t border-gray-100">
              <td className="py-2">{z.zone}</td>
              <td className="py-2 text-right">{z.users}</td>
              <td className="py-2 text-right text-gray-500">{z.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
