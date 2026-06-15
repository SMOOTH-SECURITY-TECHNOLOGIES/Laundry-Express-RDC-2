import type { ChannelPerformance } from '../../../lib/admin/payment-gateways-types';

export function ChannelPerformanceCard({ data }: { data: ChannelPerformance[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Performance par canal</h3>
      <div className="space-y-4">
        {data.map((c) => (
          <div key={c.channel}>
            <div className="flex justify-between text-sm font-semibold mb-1"><span>{c.channel}</span><span>{c.successRate}% succès</span></div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-1">
              <span>Livraison: {c.deliveryRate}%</span><span>Échecs: {c.failureRate}%</span><span>Latence: {c.latencyMs}ms</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${c.successRate}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
