import { Icon } from '../../Icon';
import type { PaymentGatewayTransaction } from '../../../lib/admin/payment-gateways-types';

export function PaymentDrawer({ tx, onClose }: { tx: PaymentGatewayTransaction | null; onClose: () => void }) {
  if (!tx) return null;
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl border-l flex flex-col">
      <div className="flex items-center justify-between p-5 border-b">
        <h2 className="font-bold">Transaction {tx.reference}</h2>
        <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
      </div>
      <div className="p-5 space-y-4 text-sm flex-1 overflow-y-auto">
        <div><p className="text-gray-500 text-xs">Client</p><p className="font-semibold">{tx.clientName}</p></div>
        <div><p className="text-gray-500 text-xs">Passerelle</p><p>{tx.gatewayName}</p></div>
        <div><p className="text-gray-500 text-xs">Montant</p><p className="text-xl font-bold">{tx.amount} {tx.currency}</p></div>
        <div><p className="text-gray-500 text-xs">Statut</p><p>{tx.statusLabel}</p></div>
        <div><p className="text-gray-500 text-xs">Date</p><p>{tx.createdAt ? new Date(tx.createdAt).toLocaleString('fr-FR') : '—'}</p></div>
        <div className="border rounded-xl p-4 bg-gray-50"><p className="text-xs font-semibold text-gray-500 mb-2">Timeline</p><p className="text-xs">Création → Traitement provider → {tx.statusLabel}</p></div>
      </div>
    </div>
  );
}
