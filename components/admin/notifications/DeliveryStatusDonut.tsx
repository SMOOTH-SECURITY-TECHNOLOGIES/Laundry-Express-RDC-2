import type { DeliveryStatusBucket } from '../../../lib/admin/notifications-types';

export function DeliveryStatusDonut({ data }: { data: DeliveryStatusBucket[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  let offset = 0;
  const r = 40; const c = 2 * Math.PI * r;
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Statut des envois</h3>
      <div className="flex items-center gap-6">
        <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
          {data.map((d) => {
            const pct = d.count / total;
            const dash = pct * c;
            const el = (
              <circle key={d.label} cx="50" cy="50" r={r} fill="none" stroke={d.color} strokeWidth="18"
                strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset} transform="rotate(-90 50 50)" />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <ul className="space-y-2 text-sm flex-1">
          {data.map((d) => (
            <li key={d.label} className="flex justify-between"><span>{d.label}</span><span className="font-semibold">{d.percent}%</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
