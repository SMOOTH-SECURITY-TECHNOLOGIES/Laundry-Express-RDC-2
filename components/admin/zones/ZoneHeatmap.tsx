import { Icon } from '../../Icon';
import type { ZoneHeatmap as ZoneHeatmapData } from '../../../lib/admin/zones-types';

export function ZoneHeatmap({ data }: { data: ZoneHeatmapData }) {
  const cellMap = new Map(data.cells.map((c) => [`${c.day}-${c.hour}`, c.count]));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="fire" className="w-5 h-5 text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-900">Heatmap demande</h3>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          <div className="flex gap-1 mb-1 pl-10">
            {data.hours.map((h) => <div key={h} className="flex-1 text-center text-[9px] text-gray-400">{h}</div>)}
          </div>
          {data.days.map((day) => (
            <div key={day} className="flex gap-1 mb-1 items-center">
              <span className="w-8 text-[9px] text-gray-400 text-right">{day}</span>
              {data.hours.map((hour) => {
                const count = cellMap.get(`${day}-${hour}`) ?? 0;
                const intensity = count / data.maxCount;
                return (
                  <div key={hour} className="flex-1 h-6 rounded-sm" style={{ backgroundColor: `rgba(37, 99, 235, ${0.1 + intensity * 0.85})` }} title={`${count} commandes`} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-gray-400 mt-2 text-center">Intensité = nombre de commandes (Jour × Heure)</p>
    </div>
  );
}
