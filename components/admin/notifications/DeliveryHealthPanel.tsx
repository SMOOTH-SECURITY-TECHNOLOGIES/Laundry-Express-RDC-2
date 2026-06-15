import type { ProviderHealth } from '../../../lib/admin/notifications-types';

const statusColor: Record<string, string> = { healthy: 'text-green-600 bg-green-100', degraded: 'text-amber-600 bg-amber-100', down: 'text-red-600 bg-red-100' };

export function DeliveryHealthPanel({ health }: { health: ProviderHealth[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Delivery Health</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {health.map((h) => (
          <div key={h.channel} className="border rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div><p className="font-semibold">{h.label} Health</p><p className="text-xs text-gray-400">{h.provider}</p></div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor[h.status] || 'bg-gray-100'}`}>{h.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
              <span>Livraison: {h.deliveryRate}%</span><span>Latence: {h.latencyMs}ms</span><span>Erreurs: {h.errorCount}</span>
            </div>
            {h.lastIncidentAt && <p className="text-[10px] text-amber-600 mt-2">Dernier incident: {new Date(h.lastIncidentAt).toLocaleString('fr-FR')}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
