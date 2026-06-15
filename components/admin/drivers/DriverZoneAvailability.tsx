import type { DriverZoneAvailability } from '../../../lib/admin/drivers-types';

export function DriverZoneAvailability({ zones }: { zones: DriverZoneAvailability[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Disponibilité par zone</h3>
      <div className="space-y-3">
        {zones.map((z) => {
          const pct = z.total > 0 ? Math.round((z.available / z.total) * 100) : 0;
          return (
            <div key={z.zone}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">{z.zone}</span>
                <span className="text-gray-500">{z.available}/{z.total}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
