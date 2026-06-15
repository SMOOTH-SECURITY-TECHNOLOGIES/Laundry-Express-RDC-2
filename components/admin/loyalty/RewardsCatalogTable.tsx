import { Icon } from '../../Icon';
import type { LoyaltyReward } from '../../../lib/admin/loyalty-types';

export function RewardsCatalogTable({ rewards, onDisable }: { rewards: LoyaltyReward[]; onDisable: (id: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="gift" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold">Catalogue récompenses</h3></div>
      <table className="w-full text-xs">
        <thead><tr className="text-[10px] text-gray-500 uppercase border-b"><th className="text-left py-2">Récompense</th><th className="text-right py-2">Points</th><th className="text-right py-2">Valeur</th><th className="text-right py-2">Utilisations</th><th className="text-left py-2">Statut</th><th className="text-right py-2">Actions</th></tr></thead>
        <tbody>
          {rewards.map((r) => (
            <tr key={r.id} className="border-b border-gray-50 dark:border-slate-800">
              <td className="py-2.5 font-medium">{r.name}</td>
              <td className="py-2.5 text-right">{r.pointsRequired}</td>
              <td className="py-2.5 text-right">{r.valueDollars} $</td>
              <td className="py-2.5 text-right">{r.usesCount}</td>
              <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span></td>
              <td className="py-2.5 text-right">
                {r.status === 'active' && <button type="button" onClick={() => onDisable(r.id)} className="text-[10px] text-rose-600 hover:underline">Désactiver</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
