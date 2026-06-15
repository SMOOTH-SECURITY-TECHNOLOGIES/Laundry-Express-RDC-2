import { Icon } from '../../Icon';
import type { ZoneEtaEntry } from '../../../lib/admin/zones-types';

export function ZoneEtaAnalytics({ data }: { data: ZoneEtaEntry[] }) {
  const max = Math.max(...data.map((d) => d.minutes), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="clock" className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">Temps moyen livraison</h3>
      </div>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.zone}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-gray-700">{d.zone}</span>
              <span className="text-gray-500">{d.minutes} min</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(d.minutes / max) * 100}%`, backgroundColor: d.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
