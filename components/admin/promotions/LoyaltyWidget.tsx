import { Icon } from '../../Icon';
import type { LoyaltyWidget as LoyaltyType } from '../../../lib/admin/promotions-types';

export function LoyaltyWidget({ data, onOpenLoyalty }: { data: LoyaltyType; onOpenLoyalty: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="star" className="w-5 h-5 text-yellow-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Fidélité</h3></div>
        <button type="button" onClick={onOpenLoyalty} className="text-[10px] text-blue-600 font-medium">Voir module →</button>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
        <div className="rounded-xl bg-gray-50 dark:bg-slate-800 p-2"><p className="text-gray-500">Distribués</p><p className="font-bold">{data.pointsDistributed.toLocaleString('fr-FR')}</p></div>
        <div className="rounded-xl bg-gray-50 dark:bg-slate-800 p-2"><p className="text-gray-500">Utilisés</p><p className="font-bold">{data.pointsUsed.toLocaleString('fr-FR')}</p></div>
        <div className="rounded-xl bg-gray-50 dark:bg-slate-800 p-2"><p className="text-gray-500">Récompenses</p><p className="font-bold">{data.rewardsRedeemed}</p></div>
      </div>
      <p className="text-[10px] font-semibold text-gray-500 mb-2">Top clients</p>
      {data.topClients.map((c) => (
        <div key={c.name} className="flex justify-between text-xs py-1 border-b border-gray-50 dark:border-slate-800"><span>{c.name}</span><span className="font-bold text-yellow-600">{c.points} pts</span></div>
      ))}
    </div>
  );
}
