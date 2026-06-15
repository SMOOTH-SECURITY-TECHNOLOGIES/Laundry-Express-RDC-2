import { Icon } from '../../Icon';
import type { DeviceBreakdown } from '../../../lib/admin/users-types';

export function DevicesDonut({ data }: { data: DeviceBreakdown[] }) {
  let offset = 0;
  const r = 40;
  const circ = 2 * Math.PI * r;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="device-phone-mobile" className="w-5 h-5 text-gray-600" />
        <h3 className="text-sm font-semibold">Appareils utilisés</h3>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {data.map((d) => {
              const dash = (d.percent / 100) * circ;
              const el = <circle key={d.device} cx="50" cy="50" r={r} fill="none" stroke={d.color} strokeWidth="16" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} />;
              offset += dash;
              return el;
            })}
          </svg>
        </div>
        <div className="flex-1 space-y-1.5 text-xs">
          {data.map((d) => (
            <div key={d.device} className="flex justify-between">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.device}</span>
              <span className="text-gray-500">{d.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
