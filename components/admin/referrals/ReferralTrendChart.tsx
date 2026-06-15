import { Icon } from '../../Icon';
import type { ReferralTrendPoint } from '../../../lib/admin/referrals-types';

interface Props {
  data: ReferralTrendPoint[];
  days: number;
  onDaysChange: (d: number) => void;
}

function buildPath(values: number[], w: number, h: number): string {
  if (!values.length) return '';
  const max = Math.max(...values, 1);
  return values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = h - (v / max) * (h - 8) - 4;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}

export function ReferralTrendChart({ data, days, onDaysChange }: Props) {
  const w = 520;
  const h = 180;
  const conversions = data.map((d) => d.conversions);
  const revenue = data.map((d) => d.revenue);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="chartBar" className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold">Évolution des conversions</h3>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDaysChange(d)}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium ${days === d ? 'bg-purple-600 text-white' : 'border text-gray-500'}`}
            >
              {d}j
            </button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-8">Aucune donnée de tendance.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <svg width={w} height={h} className="w-full max-w-full">
              <path d={buildPath(conversions, w, h)} fill="none" stroke="#3B82F6" strokeWidth="2" />
              <path d={buildPath(revenue, w, h)} fill="none" stroke="#22C55E" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          </div>
          <div className="flex gap-4 mt-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Conversions</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> Revenus générés</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            {data.map((d) => <span key={d.date}>{d.date.slice(5)}</span>)}
          </div>
        </>
      )}
    </div>
  );
}
