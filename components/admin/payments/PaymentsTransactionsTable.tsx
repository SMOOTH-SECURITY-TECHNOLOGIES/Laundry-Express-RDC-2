import { Icon } from '../../Icon';
import type { PaymentTransaction } from '../../../lib/admin/payments-types';

const statusStyle: Record<string, string> = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  refunded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  disputed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const statusLabel: Record<string, string> = {
  success: 'Réussi', pending: 'En attente', failed: 'Echoué', refunded: 'Remboursé', disputed: 'Contesté',
};

export function PaymentsTransactionsTable({ transactions, onAction }: { transactions: PaymentTransaction[]; onAction: (id: string, action: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="list" className="w-5 h-5 text-gray-700 dark:text-slate-300" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Dernières transactions</h3></div>
        <button type="button" className="text-xs text-blue-600 font-medium">Voir tout →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-gray-500 dark:text-slate-400 border-b dark:border-slate-700">
            <th className="pb-2 font-medium">Payment ID</th><th className="pb-2 font-medium">Order ID</th><th className="pb-2 font-medium">Client</th>
            <th className="pb-2 font-medium">Partenaire</th><th className="pb-2 font-medium">Montant</th><th className="pb-2 font-medium">Méthode</th>
            <th className="pb-2 font-medium">Statut</th><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium">Réf.</th><th className="pb-2 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td className="py-2.5 font-medium text-gray-900 dark:text-slate-100">{t.id}</td>
                <td className="py-2.5 text-blue-600">{t.orderId}</td>
                <td className="py-2.5">{t.client}</td>
                <td className="py-2.5">{t.partner}</td>
                <td className="py-2.5 font-semibold">{t.amount.toFixed(2)} $</td>
                <td className="py-2.5">{t.method}</td>
                <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle[t.status]}`}>{statusLabel[t.status]}</span></td>
                <td className="py-2.5 text-gray-500">{t.date}</td>
                <td className="py-2.5 text-gray-400">{t.reference}</td>
                <td className="py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {['view', 'timeline', 'investigate', 'receipt'].map((a) => (
                      <button key={a} type="button" onClick={() => onAction(t.id, a)} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-[9px] font-medium text-gray-600 dark:text-slate-300 hover:bg-blue-100 capitalize">{a === 'view' ? 'Voir' : a === 'timeline' ? 'Timeline' : a === 'investigate' ? 'Investiguer' : 'Reçu'}</button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
