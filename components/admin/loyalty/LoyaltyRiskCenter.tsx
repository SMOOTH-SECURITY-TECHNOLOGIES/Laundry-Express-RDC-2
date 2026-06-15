import { Icon } from '../../Icon';
import type { LoyaltyRisk } from '../../../lib/admin/loyalty-types';

const sevStyle: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
  critical: 'bg-red-200 text-red-900',
};

export function LoyaltyRiskCenter({ risks }: { risks: LoyaltyRisk[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="shield" className="w-5 h-5 text-red-600" /><h3 className="text-sm font-semibold">Loyalty Risk Center</h3></div>
      {risks.length === 0 ? (
        <p className="text-xs text-green-600 flex items-center gap-1"><Icon name="check" className="w-3.5 h-3.5" /> Aucun risque détecté</p>
      ) : (
        <div className="space-y-2">
          {risks.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-xs border-b border-gray-50 dark:border-slate-800 pb-2">
              <span>{r.message}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{r.count}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${sevStyle[r.severity] || sevStyle.low}`}>{r.severity}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
