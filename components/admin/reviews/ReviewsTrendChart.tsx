import { Icon } from '../../Icon';
import type { ReviewTrend } from '../../../lib/admin/reviews-types';

function path(vals: number[], w: number, h: number) {
  if (!vals.length) return '';
  const max = Math.max(...vals, 0.1);
  return vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / Math.max(vals.length - 1, 1)) * w},${h - (v / max) * (h - 8) - 4}`).join(' ');
}

export function ReviewsTrendChart({ data, days, onDaysChange }: { data: ReviewTrend[]; days: number; onDaysChange: (d: number) => void }) {
  const w = 520; const h = 160;
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="chartBar" className="w-5 h-5 text-amber-500" /><h3 className="text-sm font-semibold">Évolution satisfaction</h3></div>
        <div className="flex gap-1">{[7, 30, 90, 365].map((d) => <button key={d} type="button" onClick={() => onDaysChange(d)} className={`px-2 py-1 rounded-lg text-[10px] ${days === d ? 'bg-amber-500 text-white' : 'border'}`}>{d === 365 ? '12 mois' : `${d}j`}</button>)}</div>
      </div>
      <svg width={w} height={h} className="w-full max-w-full">
        <path d={path(data.map((d) => d.avgRating), w, h)} fill="none" stroke="#F59E0B" strokeWidth="2" />
        <path d={path(data.map((d) => d.volume), w, h)} fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
      <div className="flex gap-4 mt-2 text-[10px]">
        <span><span className="inline-block w-3 h-0.5 bg-amber-500 mr-1" />Note moyenne</span>
        <span><span className="inline-block w-3 h-0.5 bg-blue-500 mr-1" />Volume avis</span>
      </div>
    </div>
  );
}
