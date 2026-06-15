import { Icon } from '../../Icon';
import type { CampaignWatchlistItem } from '../../../lib/admin/campaigns-types';

const sev: Record<string, string> = { low: 'bg-gray-100 text-gray-700', medium: 'bg-orange-100 text-orange-700', high: 'bg-red-100 text-red-700' };

export function CampaignWatchlistCard({ items }: { items: CampaignWatchlistItem[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="shield" className="w-5 h-5 text-red-600" /><h3 className="text-sm font-semibold">Alertes marketing</h3></div>
      <div className="space-y-2">{items.map((w) => (
        <div key={w.id} className="flex justify-between text-xs border-b pb-2">
          <span>{w.message}</span><div className="flex gap-2 items-center"><span className="font-bold">{w.count}</span><span className={`px-2 py-0.5 rounded-full text-[10px] capitalize ${sev[w.severity] || sev.low}`}>{w.severity}</span></div>
        </div>
      ))}</div>
    </div>
  );
}
