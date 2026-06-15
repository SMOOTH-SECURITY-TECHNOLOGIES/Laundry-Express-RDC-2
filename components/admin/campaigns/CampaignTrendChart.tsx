import { Icon } from '../../Icon';
import type { CampaignTrendPoint } from '../../../lib/admin/campaigns-types';

function path(values: number[], w: number, h: number) {
  if (!values.length) return '';
  const max = Math.max(...values, 1);
  return values.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / Math.max(values.length - 1, 1)) * w},${h - (v / max) * (h - 8) - 4}`).join(' ');
}

export function CampaignTrendChart({ data, days, onDaysChange }: { data: CampaignTrendPoint[]; days: number; onDaysChange: (d: number) => void }) {
  const w = 520; const h = 180;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="chartBar" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold">Évolution des campagnes</h3></div>
        <div className="flex gap-1">{[7, 30, 90, 365].map((d) => <button key={d} type="button" onClick={() => onDaysChange(d)} className={`px-2 py-1 rounded-lg text-[10px] font-medium ${days === d ? 'bg-purple-600 text-white' : 'border text-gray-500'}`}>{d === 365 ? '12m' : `${d}j`}</button>)}</div>
      </div>
      {data.length === 0 ? <p className="text-xs text-gray-500 text-center py-8">Aucune donnée.</p> : (
        <>
          <svg width={w} height={h} className="w-full max-w-full"><path d={path(data.map((d) => d.messages), w, h)} fill="none" stroke="#3B82F6" strokeWidth="2" /><path d={path(data.map((d) => d.conversions), w, h)} fill="none" stroke="#22C55E" strokeWidth="2" /><path d={path(data.map((d) => d.revenue), w, h)} fill="none" stroke="#9333EA" strokeWidth="2" strokeDasharray="4 4" /></svg>
          <div className="flex gap-4 mt-2 text-[10px]"><span className="text-blue-600">● Messages</span><span className="text-green-600">● Conversions</span><span className="text-purple-600">● Revenus</span></div>
        </>
      )}
    </div>
  );
}
