import { Icon } from '../../Icon';
import type { ActivePromotion } from '../../../lib/admin/promotions-types';

const statusStyle: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  paused: 'bg-orange-100 text-orange-700',
  expired: 'bg-gray-100 text-gray-600',
  draft: 'bg-blue-100 text-blue-700',
};

const typeLabel: Record<string, string> = {
  percentage: 'Pourcentage', fixed: 'Montant fixe', delivery: 'Livraison', cashback: 'Cashback', credit: 'Crédit', referral: 'Parrainage',
};

export function PromotionsActiveTable({ promotions, onAction }: { promotions: ActivePromotion[]; onAction: (id: string, action: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="gift" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Promotions actives</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase border-b dark:border-slate-700">
            <th className="text-left py-2 px-2">Code</th><th className="text-left py-2">Type</th><th className="text-left py-2">Réduction</th>
            <th className="text-right py-2">Utilisations</th><th className="text-right py-2">CA généré</th><th className="text-left py-2">Début</th><th className="text-left py-2">Fin</th><th className="text-left py-2">Statut</th><th className="text-right py-2">Actions</th>
          </tr></thead>
          <tbody>{promotions.map((p) => (
            <tr key={p.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
              <td className="py-2.5 px-2 font-mono font-bold text-gray-900 dark:text-slate-100">{p.code}</td>
              <td className="py-2.5">{typeLabel[p.type] || p.type}</td>
              <td className="py-2.5 font-medium">{p.reduction}</td>
              <td className="py-2.5 text-right">{p.usages}</td>
              <td className="py-2.5 text-right font-bold text-green-600">{p.revenue.toLocaleString('fr-FR')} $</td>
              <td className="py-2.5">{p.startDate}</td>
              <td className="py-2.5">{p.endDate}</td>
              <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyle[p.status]}`}>{p.status === 'active' ? 'Actif' : p.status}</span></td>
              <td className="py-2.5 text-right">
                <div className="flex justify-end gap-1">
                  {['edit', 'duplicate', 'pause', 'roi'].map((a) => (
                    <button key={a} type="button" onClick={() => onAction(p.id, a)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700" title={a}>
                      <Icon name={a === 'edit' ? 'pencil' : a === 'roi' ? 'chartBar' : a === 'pause' ? 'minus' : 'document'} className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
