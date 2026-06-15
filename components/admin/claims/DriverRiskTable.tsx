import type { DriverRisk } from '../../../lib/admin/claims-types';

export function DriverRiskTable({ drivers }: { drivers: DriverRisk[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Top chauffeurs à risque</h3>
      {drivers.length === 0 ? <p className="text-sm text-gray-400">Aucune donnée chauffeur.</p> : (
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-gray-500 uppercase border-b"><th className="text-left py-2">Chauffeur</th><th className="text-right py-2">Incidents</th><th className="text-right py-2">Plaintes</th><th className="text-right py-2">Note</th><th className="text-right py-2">Risque</th></tr></thead>
          <tbody className="divide-y">
            {drivers.map((d) => (
              <tr key={d.driverId}><td className="py-2">{d.driverName}</td><td className="text-right">{d.incidentCount}</td><td className="text-right">{d.complaints}</td><td className="text-right">{d.avgRating.toFixed(1)}</td><td className="text-right font-semibold text-red-600">{d.riskScore}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
