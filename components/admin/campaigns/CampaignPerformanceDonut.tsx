import { Icon } from '../../Icon';
import type { CampaignChannelPerformance } from '../../../lib/admin/campaigns-types';

export function CampaignPerformanceDonut({ channels, totalRevenue }: { channels: CampaignChannelPerformance[]; totalRevenue: number }) {
  let offset = 0; const r = 40; const circ = 2 * Math.PI * r;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="chartBar" className="w-5 h-5 text-green-600" /><h3 className="text-sm font-semibold">Performance par canal</h3></div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {channels.map((c) => { const dash = (c.percent / 100) * circ; const el = <circle key={c.channel} cx="50" cy="50" r={r} fill="none" stroke={c.color} strokeWidth="18" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} />; offset += dash; return el; })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold">{totalRevenue.toLocaleString('fr-FR')} $</span>
            <span className="text-[10px] text-gray-500">Revenus</span>
          </div>
        </div>
        <div className="flex-1 space-y-2 text-xs w-full">
          {channels.map((c) => (
            <div key={c.channel} className="flex justify-between"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.channel} ({c.percent}%)</span><span>{c.conversions} conv. • {c.revenue.toLocaleString('fr-FR')} $</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
