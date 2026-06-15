import type { DeliveryStatus } from '../../../lib/admin/sms-types';

export function DeliveryStatusDonut({ data }: { data: DeliveryStatus[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-semibold mb-4">Statut des envois</h3>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.label}>
            <div className="flex justify-between text-sm mb-1"><span>{d.label}</span><span className="font-medium">{d.percent}%</span></div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${d.percent}%`, background: d.color }} /></div>
            <p className="text-xs text-gray-400 mt-0.5">{d.count.toLocaleString('fr-FR')} messages</p>
          </div>
        ))}
      </div>
    </div>
  );
}
