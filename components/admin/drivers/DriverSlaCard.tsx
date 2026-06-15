import { Icon } from '../../Icon';
import type { DriverSlaData } from '../../../lib/admin/drivers-types';

export function DriverSlaCard({ data }: { data: DriverSlaData }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="shield-check" className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">SLA Center</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Dans SLA" value={data.inSla} pct={data.inSlaPercent} color="green" />
        <Stat label="À risque" value={data.atRisk} pct={data.atRiskPercent} color="orange" />
        <Stat label="Dépassé" value={data.breached} pct={data.breachedPercent} color="red" />
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100">
        <div className="bg-green-500 h-full" style={{ width: `${data.inSlaPercent}%` }} />
        <div className="bg-orange-500 h-full" style={{ width: `${data.atRiskPercent}%` }} />
        <div className="bg-red-500 h-full" style={{ width: `${data.breachedPercent}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  const s = { green: 'text-green-600 bg-green-50', orange: 'text-orange-600 bg-orange-50', red: 'text-red-600 bg-red-50' }[color];
  return (
    <div className={`rounded-xl p-3 ${s}`}>
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px]">{pct}%</p>
    </div>
  );
}
