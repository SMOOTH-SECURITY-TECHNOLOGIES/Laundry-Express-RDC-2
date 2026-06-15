import { Icon } from '../../Icon';
import type { SlaHeatmap as SlaHeatmapData } from '../../../lib/admin/sla-types';

export function SlaHeatmap({ data }: { data: SlaHeatmapData }) {
  const cellMap = new Map(data.cells.map((c) => [`${c.day}-${c.hour}`, c.violations]));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="fire" className="w-5 h-5 text-red-500" />
        <h3 className="text-sm font-semibold text-gray-900">Heatmap violations SLA</h3>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[420px]">
          <div className="flex gap-1 mb-1 pl-10">{data.hours.map((h) => <div key={h} className="flex-1 text-center text-[9px] text-gray-400">{h}</div>)}</div>
          {data.days.map((day) => (
            <div key={day} className="flex gap-1 mb-1 items-center">
              <span className="w-8 text-[9px] text-gray-400 text-right">{day}</span>
              {data.hours.map((hour) => {
                const v = cellMap.get(`${day}-${hour}`) ?? 0;
                const intensity = v / data.maxViolations;
                const r = Math.round(255 * intensity);
                const g = Math.round(200 * (1 - intensity));
                return <div key={hour} className="flex-1 h-5 rounded-sm" style={{ backgroundColor: `rgb(${r},${g},50)` }} title={`${v} violations`} />;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
