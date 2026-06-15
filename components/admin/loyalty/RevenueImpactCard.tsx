import { Icon } from '../../Icon';
import type { RevenueImpact } from '../../../lib/admin/loyalty-types';

export function RevenueImpactCard({ data }: { data: RevenueImpact }) {
  const items = [
    { label: 'Revenus influencés', value: `${data.influencedRevenue.toLocaleString('fr-FR')} $`, change: `+${data.influencedRevenueChange}%` },
    { label: 'Panier moyen membres', value: `${data.avgBasketMembers} $` },
    { label: 'Panier moyen non-membres', value: `${data.avgBasketNonMembers} $` },
    { label: 'Fréquence cmd. membres', value: `${data.orderFrequencyMembers}` },
    { label: 'Coût points utilisés', value: `${data.pointsCost.toLocaleString('fr-FR')} $` },
  ];
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="currencyDollar" className="w-5 h-5 text-green-600" /><h3 className="text-sm font-semibold">Impact revenus fidélité</h3></div>
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.label} className="flex justify-between text-xs">
            <span className="text-gray-500">{i.label}</span>
            <span className="font-bold">{i.value}{i.change && <span className="text-green-600 ml-1 text-[10px]">{i.change}</span>}</span>
          </div>
        ))}
        <div className="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
          <p className="text-xs text-gray-500">ROI fidélité</p>
          <p className="text-2xl font-bold text-green-600">{data.loyaltyRoi}x</p>
        </div>
      </div>
    </div>
  );
}
