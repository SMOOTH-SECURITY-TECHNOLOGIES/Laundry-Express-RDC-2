import { Icon } from '../../Icon';
import type { ReferralChannelPerformance } from '../../../lib/admin/referrals-types';

export function ReferralPerformanceDonut({ channels, totalRevenue, onViewAttribution }: {
  channels: ReferralChannelPerformance[];
  totalRevenue: number;
  onViewAttribution?: () => void;
}) {
  let offset = 0;
  const r = 40;
  const circ = 2 * Math.PI * r;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="chartBar" className="w-5 h-5 text-green-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Performance du programme</h3>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {channels.map((c) => {
              const dash = (c.percent / 100) * circ;
              const el = (
                <circle key={c.channel} cx="50" cy="50" r={r} fill="none" stroke={c.color} strokeWidth="18"
                  strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} />
              );
              offset += dash;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
            <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{totalRevenue.toLocaleString('fr-FR')} $</span>
            <span className="text-[10px] text-gray-500">Revenus générés</span>
          </div>
        </div>
        <div className="flex-1 space-y-2 text-xs w-full">
          {channels.map((c) => (
            <div key={c.channel} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                {c.channel} ({c.percent}%)
              </span>
            </div>
          ))}
          <button type="button" onClick={onViewAttribution} className="text-purple-600 text-xs font-medium mt-2 hover:underline">
            Voir l&apos;attribution complète →
          </button>
        </div>
      </div>
    </div>
  );
}
