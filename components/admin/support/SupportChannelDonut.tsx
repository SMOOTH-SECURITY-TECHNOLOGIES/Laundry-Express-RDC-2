import { Icon } from '../../Icon';
import type { ChannelBreakdown } from '../../../lib/admin/support-types';

export function SupportChannelDonut({ channels }: { channels: ChannelBreakdown[] }) {
  let offset = 0; const r = 40; const circ = 2 * Math.PI * r;
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="chatBubble" className="w-5 h-5 text-green-600" /><h3 className="text-sm font-semibold">Répartition par canal</h3></div>
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {channels.map((c) => { const dash = (c.percent / 100) * circ; const el = <circle key={c.channel} cx="50" cy="50" r={r} fill="none" stroke={c.color} strokeWidth="16" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} />; offset += dash; return el; })}
          </svg>
        </div>
        <div className="flex-1 space-y-1 text-xs">{channels.map((c) => <div key={c.channel} className="flex justify-between"><span className="capitalize">{c.channel}</span><span className="text-gray-500">{c.percent}%</span></div>)}</div>
      </div>
    </div>
  );
}
