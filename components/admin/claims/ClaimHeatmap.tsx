import type { HeatmapZone } from '../../../lib/admin/claims-types';

export function ClaimHeatmap({ zones }: { zones: HeatmapZone[] }) {
  const max = Math.max(...zones.map((z) => z.claims), 1);
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Heatmap des réclamations — Kinshasa</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {zones.map((z) => {
          const intensity = z.claims / max;
          const bg = intensity > 0.7 ? 'bg-red-500' : intensity > 0.4 ? 'bg-amber-400' : intensity > 0.1 ? 'bg-green-400' : 'bg-green-200';
          return (
            <div key={z.zone} className={`${bg} rounded-xl p-3 text-white text-center`}>
              <p className="font-semibold text-sm">{z.zone}</p>
              <p className="text-xs opacity-90">{z.claims} réclamations</p>
              <p className="text-[10px] opacity-75">{z.density}% densité</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
