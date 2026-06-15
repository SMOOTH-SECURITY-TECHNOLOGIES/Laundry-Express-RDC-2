import { Icon } from '../../Icon';
import type { RatingDistribution } from '../../../lib/admin/reviews-types';

export function RatingDistributionChart({ data, total }: { data: RatingDistribution[]; total: number }) {
  let offset = 0; const r = 40; const circ = 2 * Math.PI * r;
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="star" className="w-5 h-5 text-amber-500" /><h3 className="text-sm font-semibold">Répartition des notes</h3></div>
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {data.map((d) => { const dash = (d.percent / 100) * circ; const el = <circle key={d.stars} cx="50" cy="50" r={r} fill="none" stroke={d.color} strokeWidth="16" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} />; offset += dash; return el; })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-lg font-bold">{total.toLocaleString('fr-FR')}</span><span className="text-[10px] text-gray-500">Total</span></div>
        </div>
        <div className="flex-1 space-y-1 text-xs">{data.map((d) => <div key={d.stars} className="flex justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.stars} ★</span><span>{d.count} ({d.percent}%)</span></div>)}</div>
      </div>
    </div>
  );
}
