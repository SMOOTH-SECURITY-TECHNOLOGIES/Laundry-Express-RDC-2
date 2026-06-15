import { Icon } from '../../Icon';
import type { RefundRequest } from '../../../lib/admin/refunds-types';

const statusStyle: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  disputed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const priorityStyle: Record<string, string> = {
  low: 'text-gray-500', medium: 'text-blue-600', high: 'text-orange-600', critical: 'text-red-600 font-bold',
};

const reasonBadge: Record<string, string> = {
  delivery_delay: 'bg-orange-100 text-orange-700',
  order_error: 'bg-red-100 text-red-700',
  damaged_item: 'bg-purple-100 text-purple-700',
  client_cancel: 'bg-blue-100 text-blue-700',
  fraud: 'bg-red-200 text-red-800',
  double_payment: 'bg-yellow-100 text-yellow-700',
};

export function RefundRequestsTable({ requests, onAction }: { requests: RefundRequest[]; onAction: (id: string, action: string) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="list" className="w-5 h-5 text-gray-700 dark:text-slate-300" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Refund Requests</h3></div>
        <button type="button" className="text-xs text-blue-600 font-medium">Voir tout →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-gray-500 dark:text-slate-400 border-b dark:border-slate-700">
            <th className="pb-2 font-medium">Refund ID</th><th className="pb-2 font-medium">Order ID</th><th className="pb-2 font-medium">Client</th>
            <th className="pb-2 font-medium">Partenaire</th><th className="pb-2 font-medium">Montant</th><th className="pb-2 font-medium">Motif</th>
            <th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium">Priorité</th><th className="pb-2 font-medium">Statut</th><th className="pb-2 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td className="py-2.5 font-medium text-gray-900 dark:text-slate-100">{r.id}</td>
                <td className="py-2.5 text-blue-600">{r.orderId}</td>
                <td className="py-2.5">{r.client}</td>
                <td className="py-2.5">{r.partner}</td>
                <td className="py-2.5 font-semibold">{r.amount} $</td>
                <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${reasonBadge[r.reasonCode] ?? 'bg-gray-100 text-gray-700'}`}>{r.reason}</span></td>
                <td className="py-2.5 text-gray-500">{r.date}</td>
                <td className={`py-2.5 capitalize ${priorityStyle[r.priority]}`}>{r.priority}</td>
                <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusStyle[r.status]}`}>{r.status}</span></td>
                <td className="py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {['view', 'investigate', 'approve', 'reject'].map((a) => (
                      <button key={a} type="button" onClick={() => onAction(r.id, a)} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-[9px] font-medium text-gray-600 dark:text-slate-300 hover:bg-blue-100 capitalize">{a === 'view' ? 'Voir' : a === 'investigate' ? 'Investiguer' : a === 'approve' ? 'Approuver' : 'Rejeter'}</button>
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
