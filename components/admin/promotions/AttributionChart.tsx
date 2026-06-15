import { Icon } from '../../Icon';
import type { AttributionChannel } from '../../../lib/admin/promotions-types';

export function AttributionChart({ channels }: { channels: AttributionChannel[] }) {
  let offset = 0;
  const r = 40; const circ = 2 * Math.PI * r;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="device-phone-mobile" className="w-5 h-5 text-green-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Répartition par canal</h3></div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {channels.map((c) => {
              const dash = (c.percent / 100) * circ;
              const el = <circle key={c.channel} cx="50" cy="50" r={r} fill="none" stroke={c.color} strokeWidth="18" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} />;
              offset += dash;
              return el;
            })}
          </svg>
        </div>
        <div className="flex-1 space-y-2 text-xs w-full">
          {channels.map((c) => (
            <div key={c.channelKey} className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.channel} ({c.percent}%)</span>
              <span className="font-bold text-green-600">{c.roi}x ROI</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
