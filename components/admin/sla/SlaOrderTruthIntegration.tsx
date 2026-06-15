import { Icon } from '../../Icon';
import type { SlaProblematicOrder } from '../../../lib/admin/sla-types';

export function SlaOrderTruthIntegration({ orders, onOpenTimeline }: { orders: SlaProblematicOrder[]; onOpenTimeline: (orderId: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="clock" className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">Order Truth — Top commandes problématiques</h3>
        </div>
      </div>
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-100">
            <div>
              <p className="text-sm font-medium text-gray-900">{o.id} — {o.client}</p>
              <p className="text-xs text-gray-500">{o.issue} · SLA {o.slaPercent}%</p>
            </div>
            <button type="button" onClick={() => onOpenTimeline(o.id)} className="text-xs text-purple-600 font-medium hover:text-purple-800">Ouvrir Timeline</button>
          </div>
        ))}
      </div>
    </div>
  );
}
