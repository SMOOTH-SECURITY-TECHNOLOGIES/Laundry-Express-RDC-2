import { PAYMENT_GATEWAYS_WRITE_ENABLED } from '../../../lib/admin/payment-gateways-api';
import type { PaymentReconciliation } from '../../../lib/admin/payment-gateways-types';

const st: Record<string, string> = {
  match: 'bg-green-100 text-green-700', missing_provider: 'bg-red-100 text-red-700',
  missing_internal: 'bg-amber-100 text-amber-700', amount_mismatch: 'bg-orange-100 text-orange-700',
};

export function PaymentReconciliationCenter({ items, onRun }: { items: PaymentReconciliation[]; onRun: () => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase">Réconciliation</h3>
        <button type="button" disabled={!PAYMENT_GATEWAYS_WRITE_ENABLED} onClick={onRun} className="text-xs text-blue-600 font-semibold disabled:opacity-40">Lancer réconciliation</button>
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs text-gray-500"><tr><th className="text-left pb-2">Référence</th><th className="text-right pb-2">Provider</th><th className="text-right pb-2">Interne</th><th className="text-right pb-2">Statut</th></tr></thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="py-2 font-mono text-xs">{r.reference}</td>
              <td className="py-2 text-right">{r.providerAmount ?? '—'}</td>
              <td className="py-2 text-right">{r.internalAmount ?? '—'}</td>
              <td className="py-2 text-right"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st[r.status] || 'bg-gray-100'}`}>{r.statusLabel}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
