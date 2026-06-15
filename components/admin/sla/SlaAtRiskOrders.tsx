import { Icon } from '../../Icon';
import type { SlaAtRiskOrder } from '../../../lib/admin/sla-types';

export function SlaAtRiskOrders({ orders, onInvestigate }: { orders: SlaAtRiskOrder[]; onInvestigate: (orderId: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="warning" className="w-5 h-5 text-orange-500" />
          <h3 className="text-sm font-semibold text-gray-900">Commandes à risque ({orders.length})</h3>
        </div>
        <button type="button" className="text-xs text-blue-600 font-medium">Voir tout →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-gray-500 border-b">
            <th className="pb-2 font-medium">Commande</th><th className="pb-2 font-medium">Client</th><th className="pb-2 font-medium">Zone</th>
            <th className="pb-2 font-medium">Partenaire</th><th className="pb-2 font-medium">ETA</th><th className="pb-2 font-medium">SLA restant</th><th className="pb-2 font-medium">Action</th>
          </tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-orange-50/30">
                <td className="py-2.5 font-medium text-gray-900">{o.id}</td>
                <td className="py-2.5 text-gray-600">{o.client}</td>
                <td className="py-2.5 text-gray-600">{o.zone}</td>
                <td className="py-2.5 text-gray-600">{o.partner}</td>
                <td className="py-2.5 text-gray-600">{o.eta}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, o.slaRemainingMinutes * 10)}%` }} />
                    </div>
                    <span className="text-orange-600 font-medium">{o.slaRemainingLabel}</span>
                  </div>
                </td>
                <td className="py-2.5">
                  <button type="button" onClick={() => onInvestigate(o.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-100 text-orange-700 text-[10px] font-medium hover:bg-orange-200">
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
