import type { PaymentProviderHealth } from '../../../lib/admin/payment-gateways-types';

const st: Record<string, string> = { healthy: 'text-green-600 bg-green-100', degraded: 'text-amber-600 bg-amber-100', down: 'text-red-600 bg-red-100' };

export function PaymentHealthPanel({ health }: { health: PaymentProviderHealth[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Payment Health</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {health.map((h) => (
          <div key={h.gatewaySlug} className="border rounded-xl p-4">
            <div className="flex justify-between mb-2"><p className="font-semibold">{h.name}</p><span className={`px-2 py-0.5 rounded-full text-xs capitalize ${st[h.status] || 'bg-gray-100'}`}>{h.status}</span></div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <span>Uptime: {h.uptime}%</span><span>Latence: {h.latencyMs}ms</span>
              <span>Succès: {h.successRate}%</span><span>Erreurs: {h.errorRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
