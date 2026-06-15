import { Icon } from '../../Icon';
import type { ZonePerformance } from '../../../lib/admin/ads-types';

export function AdsZoneMap({ zones }: { zones: ZonePerformance[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="map" className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Performance géographique — Kinshasa</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative bg-slate-100 dark:bg-slate-800 rounded-xl h-48">
          {zones.map((z) => (
            <div
              key={z.id}
              className="absolute rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-lg"
              style={{
                left: `${z.mapX}%`,
                top: `${z.mapY}%`,
                width: `${28 + z.conversions}px`,
                height: `${28 + z.conversions}px`,
                background: z.heatColor,
                transform: 'translate(-50%,-50%)',
              }}
              title={`${z.name}: ${z.budget} $ budget, ${z.conversions} conv., ${z.roi}x ROI`}
            >
              {z.name.slice(0, 3)}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {zones.map((z) => (
            <div key={z.id} className="flex items-center justify-between text-xs">
              <span className="font-medium">{z.name}</span>
              <span className="text-gray-500">{z.budget.toLocaleString('fr-FR')} $</span>
              <span className="text-gray-500">{z.conversions} conv.</span>
              <span className="font-bold text-green-600">{z.roi}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
