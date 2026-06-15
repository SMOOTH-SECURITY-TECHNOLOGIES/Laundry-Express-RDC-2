import type { DriverAvailabilityDay } from '../../../lib/admin/drivers-types';

const COLORS = { available: 'bg-green-400', busy: 'bg-blue-400', leave: 'bg-gray-300', pause: 'bg-orange-400' };
const LABELS = { available: 'Disponible', busy: 'Occupé', leave: 'Congé', pause: 'Pause' };

export function DriverAvailabilityCalendar({ days }: { days: DriverAvailabilityDay[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Disponibilité</h4>
      <div className="flex gap-2">
        {days.map((d) => (
          <div key={d.date} className="flex-1 text-center">
            <div className={`h-10 rounded-lg ${COLORS[d.status]} opacity-80 mb-1`} title={LABELS[d.status]} />
            <span className="text-[10px] text-gray-500">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {Object.entries(LABELS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${COLORS[k as keyof typeof COLORS]}`} /><span className="text-[10px] text-gray-500">{v}</span></div>
        ))}
      </div>
    </div>
  );
}
