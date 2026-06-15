import { Icon } from '../../Icon';
import type { WatchlistItem } from '../../../lib/admin/users-types';

const SEV: Record<string, string> = {
  low: 'bg-yellow-100 text-yellow-700', medium: 'bg-orange-100 text-orange-700', high: 'bg-red-100 text-red-700',
};

export function UserWatchlistCard({ items }: { items: WatchlistItem[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-200 dark:border-red-900 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="warning" className="w-5 h-5 text-red-600" />
        <h3 className="text-sm font-semibold text-red-700">Watchlist utilisateurs</h3>
      </div>
      <div className="space-y-2">
        {items.map((w) => (
          <div key={w.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-red-50/50 dark:bg-red-900/10">
            <span>{w.message}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">{w.count}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${SEV[w.severity]}`}>{w.severity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
