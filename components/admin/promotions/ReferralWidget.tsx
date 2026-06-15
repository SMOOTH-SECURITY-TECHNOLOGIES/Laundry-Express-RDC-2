import { Icon } from '../../Icon';
import type { ReferralWidget as ReferralType } from '../../../lib/admin/promotions-types';

export function ReferralWidget({ data, onOpenReferral }: { data: ReferralType; onOpenReferral: () => void }) {
  const items = [
    { label: 'Invitations envoyées', value: data.invitationsSent },
    { label: 'Comptes créés', value: data.accountsCreated },
    { label: 'Commandes générées', value: data.ordersGenerated },
    { label: 'Récompenses distribuées', value: `${data.rewardsDistributed.toLocaleString('fr-FR')} $` },
  ];
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="share" className="w-5 h-5 text-green-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Parrainage</h3></div>
        <button type="button" onClick={onOpenReferral} className="text-[10px] text-blue-600 font-medium">Voir module →</button>
      </div>
      <div className="space-y-2">{items.map((i) => (
        <div key={i.label} className="flex justify-between rounded-xl bg-gray-50 dark:bg-slate-800 px-3 py-2 text-xs">
          <span className="text-gray-600 dark:text-slate-400">{i.label}</span>
          <span className="font-bold text-gray-900 dark:text-slate-100">{i.value}</span>
        </div>
      ))}</div>
    </div>
  );
}
