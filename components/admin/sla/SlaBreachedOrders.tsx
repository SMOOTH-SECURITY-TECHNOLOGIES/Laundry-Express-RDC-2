import { Icon } from '../../Icon';
import type { SlaBreachedOrder } from '../../../lib/admin/sla-types';

export function SlaBreachedOrders({ orders, onInvestigate }: { orders: SlaBreachedOrder[]; onInvestigate: (orderId: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="exclamation-circle" className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-900">Commandes hors SLA ({orders.length})</h3>
        </div>
        <button type="button" className="text-xs text-blue-600 font-medium">Voir tout →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-gray-500 border-b">
            <th className="pb-2 font-medium">Commande</th><th className="pb-2 font-medium">Retard</th><th className="pb-2 font-medium">Cause</th>
            <th className="pb-2 font-medium">Responsable</th><th className="pb-2 font-medium">Impact</th><th className="pb-2 font-medium">Action</th>
          </tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-red-50/30">
                <td className="py-2.5 font-medium text-gray-900">{o.id}</td>
                <td className="py-2.5 font-semibold text-red-600">{o.delayLabel}</td>
                <td className="py-2.5 text-gray-600">{o.cause}</td>
                <td className="py-2.5 text-gray-600">{o.responsible}</td>
                <td className="py-2.5 font-medium text-red-600">{o.impactAmount} $</td>
                <td className="py-2.5">
                  <button type="button" onClick={() => onInvestigate(o.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 text-red-700 text-[10px] font-medium hover:bg-red-200">
                    <Icon name="magnifying-glass-plus" className="w-3 h-3" /> Investiguer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
