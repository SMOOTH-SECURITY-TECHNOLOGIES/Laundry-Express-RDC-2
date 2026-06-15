import type { ChannelPerformance } from '../../../lib/admin/notifications-types';

export function ChannelPerformanceCard({ data }: { data: ChannelPerformance[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Performance par canal</h3>
      <div className="space-y-4">
        {data.map((c) => (
          <div key={c.channel}>
            <div className="flex justify-between text-sm font-semibold mb-1"><span>{c.label}</span><span className="text-gray-500">{c.deliveryRate}% livraison</span></div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
              <span>Ouverture: {c.openRate}%</span><span>Clics: {c.clickRate}%</span><span className="text-red-600">Échecs: {c.failures}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full mt-1 overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.deliveryRate}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
