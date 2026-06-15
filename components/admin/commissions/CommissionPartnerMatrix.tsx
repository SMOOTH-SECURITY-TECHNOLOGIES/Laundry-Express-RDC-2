import { Icon } from '../../Icon';
import type { CommissionPartnerRow } from '../../../lib/admin/commissions-types';

const statusStyle: Record<string, { dot: string; label: string }> = {
  healthy: { dot: 'bg-green-500', label: 'Healthy' },
  pending: { dot: 'bg-blue-500', label: 'Pending' },
  delayed: { dot: 'bg-orange-500', label: 'Delayed' },
  blocked: { dot: 'bg-red-500', label: 'Blocked' },
  disputed: { dot: 'bg-purple-500', label: 'Disputed' },
};

export function CommissionPartnerMatrix({ partners, onAction }: { partners: CommissionPartnerRow[]; onAction: (partnerId: string, action: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="users" className="w-5 h-5 text-gray-700 dark:text-slate-300" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Matrice des commissions par partenaire</h3></div>
        <button type="button" className="text-xs text-blue-600 font-medium">Voir tout →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-gray-500 dark:text-slate-400 border-b dark:border-slate-700">
            <th className="pb-2 font-medium">Partenaire</th><th className="pb-2 font-medium">Type</th><th className="pb-2 font-medium">CA</th>
            <th className="pb-2 font-medium">Générée</th><th className="pb-2 font-medium">Payée</th><th className="pb-2 font-medium">Due</th>
            <th className="pb-2 font-medium">Retard</th><th className="pb-2 font-medium">Statut</th><th className="pb-2 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {partners.map((p) => {
              const st = statusStyle[p.status] ?? statusStyle.pending;
              return (
                <tr key={p.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 font-medium text-gray-900 dark:text-slate-100">{p.name}</td>
                  <td className="py-2.5 text-gray-600 dark:text-slate-400">{p.type}</td>
                  <td className="py-2.5">{p.revenue.toLocaleString('fr-FR')} $</td>
                  <td className="py-2.5">{p.generated.toLocaleString('fr-FR')} $</td>
                  <td className="py-2.5 text-green-600">{p.paid.toLocaleString('fr-FR')} $</td>
                  <td className="py-2.5 text-orange-600">{p.due.toLocaleString('fr-FR')} $</td>
                  <td className="py-2.5">{p.delayDays > 0 ? `${p.delayDays}j` : '—'}</td>
                  <td className="py-2.5"><span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${st.dot}`} />{st.label}</span></td>
                  <td className="py-2.5">
                    <div className="flex gap-1">
                      {['view', 'edit', 'history', 'pay'].map((a) => (
                        <button key={a} type="button" onClick={() => onAction(p.id, a)} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-[9px] font-medium text-gray-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 capitalize">{a === 'view' ? 'Voir' : a === 'edit' ? 'Modifier' : a === 'history' ? 'Historique' : 'Payer'}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
