import type { PaymentRefund } from '../../../lib/admin/payment-gateways-types';

export function RefundCenter({ refunds }: { refunds: PaymentRefund[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Refund Center</h3>
      <table className="w-full text-sm">
        <thead className="text-xs text-gray-500"><tr><th className="text-left pb-2">Client</th><th className="text-right pb-2">Montant</th><th className="text-left pb-2">Raison</th><th className="text-right pb-2">Statut</th></tr></thead>
        <tbody>
          {refunds.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="py-2">{r.clientName}</td>
              <td className="py-2 text-right font-semibold">{r.amount} $</td>
              <td className="py-2 text-gray-500 text-xs">{r.reason || '—'}</td>
              <td className="py-2 text-right"><span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
