import type { PaymentSettlement } from '../../../lib/admin/payment-gateways-types';

const st: Record<string, string> = { scheduled: 'bg-blue-100 text-blue-700', in_progress: 'bg-amber-100 text-amber-700', completed: 'bg-green-100 text-green-700', delayed: 'bg-red-100 text-red-700' };

export function SettlementCenter({ settlements }: { settlements: PaymentSettlement[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Settlement Center</h3>
      <table className="w-full text-sm">
        <thead className="text-xs text-gray-500 uppercase"><tr><th className="text-left pb-2">Passerelle</th><th className="text-left pb-2">Date</th><th className="text-right pb-2">Montant</th><th className="text-right pb-2">Statut</th></tr></thead>
        <tbody>
          {settlements.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="py-2">{s.gatewayName}</td>
              <td className="py-2 text-gray-500 text-xs">{s.scheduledAt ? new Date(s.scheduledAt).toLocaleDateString('fr-FR') : '—'}</td>
              <td className="py-2 text-right font-semibold">{s.amount.toLocaleString('fr-FR')} $</td>
              <td className="py-2 text-right"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st[s.status] || 'bg-gray-100'}`}>{s.statusLabel}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
