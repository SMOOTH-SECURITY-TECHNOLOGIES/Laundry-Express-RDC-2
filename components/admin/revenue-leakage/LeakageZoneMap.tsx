import { Icon } from '../../Icon';
import type { LeakageZoneStats } from '../../../lib/admin/revenue-leakage-types';

export function LeakageZoneMap({ zones }: { zones: LeakageZoneStats[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="map" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Leakage par zone — Kinshasa</h3></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative bg-slate-100 dark:bg-slate-800 rounded-xl h-48 overflow-hidden">
          {zones.map((z) => (
            <div key={z.id} className="absolute rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-lg" style={{ left: `${z.mapX}%`, top: `${z.mapY}%`, width: `${24 + z.leakPercent * 8}px`, height: `${24 + z.leakPercent * 8}px`, background: z.heatColor, transform: 'translate(-50%,-50%)' }} title={`${z.name}: ${z.leakAmount} $`}>{z.name.slice(0, 3)}</div>
          ))}
        </div>
        <div className="space-y-2">
          {zones.map((z) => (
            <div key={z.id} className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-900 dark:text-slate-100">{z.name}</span>
              <span className="text-red-600 font-bold">{z.leakAmount.toLocaleString('fr-FR')} $</span>
              <span className="text-gray-500">{z.leakPercent}%</span>
              <div className="w-16 h-2 rounded-full bg-gray-100 dark:bg-slate-700"><div className="h-full rounded-full" style={{ width: `${Math.min(100, z.leakPercent * 30)}%`, background: z.heatColor }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
