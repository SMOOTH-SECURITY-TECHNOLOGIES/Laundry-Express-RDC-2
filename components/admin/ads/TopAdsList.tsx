import { Icon } from '../../Icon';
import type { TopAd } from '../../../lib/admin/ads-types';

export function TopAdsList({ ads }: { ads: TopAd[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="star" className="w-5 h-5 text-yellow-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Top publicités (par ROI)</h3>
      </div>
      <div className="space-y-2">
        {ads.length === 0 && <p className="text-xs text-gray-500">Aucune donnée disponible.</p>}
        {ads.map((ad) => (
          <div key={ad.rank} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">{ad.rank}</span>
              <span className="font-medium">{ad.title}</span>
            </span>
            <span className="font-bold text-green-600">{ad.roi}x</span>
          </div>
        ))}
      </div>
    </div>
  );
}
