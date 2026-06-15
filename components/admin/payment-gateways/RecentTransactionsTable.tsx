import type { PaymentGatewayTransaction } from '../../../lib/admin/payment-gateways-types';

const statusStyle: Record<string, string> = {
  success: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-gray-100 text-gray-600', expired: 'bg-gray-100 text-gray-500',
  declined: 'bg-red-100 text-red-700', refunded: 'bg-violet-100 text-violet-700',
};

export function RecentTransactionsTable({ transactions, onOpen }: { transactions: PaymentGatewayTransaction[]; onOpen: (t: PaymentGatewayTransaction) => void }) {
  if (!transactions.length) return <div className="bg-white rounded-2xl border border-dashed p-10 text-center text-sm">Aucune transaction trouvée.</div>;
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b"><h3 className="text-sm font-semibold text-gray-500 uppercase">Transactions récentes</h3></div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase"><tr><th className="px-4 py-3 text-left">Référence</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Passerelle</th><th className="px-4 py-3 text-right">Montant</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Actions</th></tr></thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs">{t.reference}</td>
              <td className="px-4 py-3">{t.clientName}</td>
              <td className="px-4 py-3">{t.gatewayName}</td>
              <td className="px-4 py-3 text-right font-semibold">{t.amount} {t.currency}</td>
              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle[t.status] || 'bg-gray-100'}`}>{t.statusLabel}</span></td>
              <td className="px-4 py-3 text-xs text-gray-500">{t.createdAt ? new Date(t.createdAt).toLocaleString('fr-FR') : '—'}</td>
              <td className="px-4 py-3"><button type="button" onClick={() => onOpen(t)} className="text-xs text-blue-600 font-semibold">Voir</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
