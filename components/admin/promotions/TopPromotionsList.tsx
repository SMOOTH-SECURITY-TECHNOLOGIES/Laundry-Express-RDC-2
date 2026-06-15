import { Icon } from '../../Icon';
import type { TopPromotion } from '../../../lib/admin/promotions-types';

export function TopPromotionsList({ promotions }: { promotions: TopPromotion[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="trophy" className="w-5 h-5 text-yellow-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Top promotions</h3></div>
      <div className="space-y-2">{promotions.map((p) => (
        <div key={p.code} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-slate-700 p-3">
          <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold flex items-center justify-center">{p.rank}</span>
          <div className="flex-1"><p className="font-mono font-bold text-sm">{p.code}</p><p className="text-[10px] text-gray-500">{p.usages} utilisations</p></div>
          <div className="text-right"><p className="font-bold text-green-600">{p.revenue.toLocaleString('fr-FR')} $</p><p className="text-[10px] text-gray-500">{p.roi}x ROI</p></div>
        </div>
      ))}</div>
    </div>
  );
}
