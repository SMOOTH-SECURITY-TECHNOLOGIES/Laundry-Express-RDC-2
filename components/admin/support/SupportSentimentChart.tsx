import { Icon } from '../../Icon';
import type { SentimentBreakdown } from '../../../lib/admin/support-types';

export function SupportSentimentChart({ data }: { data: SentimentBreakdown[] }) {
  let offset = 0; const r = 40; const circ = 2 * Math.PI * r;
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="heart" className="w-5 h-5 text-pink-500" /><h3 className="text-sm font-semibold">Sentiment client</h3></div>
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {data.map((d) => { const dash = (d.percent / 100) * circ; const el = <circle key={d.sentiment} cx="50" cy="50" r={r} fill="none" stroke={d.color} strokeWidth="16" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} />; offset += dash; return el; })}
          </svg>
        </div>
        <div className="flex-1 space-y-1 text-xs">{data.map((d) => <div key={d.sentiment} className="flex justify-between"><span>{d.sentiment}</span><span className="text-gray-500">{d.percent}%</span></div>)}</div>
      </div>
    </div>
  );
}
