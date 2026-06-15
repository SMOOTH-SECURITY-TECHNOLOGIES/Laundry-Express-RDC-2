import { Icon } from '../../Icon';
import type { TruthCorridorHealth } from '../../../lib/admin/revenue-leakage-types';

export function LeakageTruthIntegration({ truthHealth, onViewCorridor, onInvestigate }: {
  truthHealth: TruthCorridorHealth[];
  onViewCorridor: () => void;
  onInvestigate: () => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="shield-check" className="w-5 h-5 text-green-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Truth Corridor Integration</h3></div>
      <div className="space-y-3 mb-4">
        {truthHealth.map((t) => (
          <div key={t.name}>
            <div className="flex justify-between text-xs mb-1"><span className="font-medium text-gray-900 dark:text-slate-100">{t.name}</span><span className="font-bold" style={{ color: t.color }}>{t.percent}%</span></div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-700"><div className="h-full rounded-full transition-all" style={{ width: `${t.percent}%`, background: t.color }} /></div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onViewCorridor} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800">Voir corridor</button>
        <button type="button" onClick={onInvestigate} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600 text-white hover:bg-purple-700">Investiguer</button>
      </div>
    </div>
  );
}
