import type { SuccessRatePoint } from '../../../lib/admin/payment-gateways-types';

export function SuccessRateChart({ data }: { data: SuccessRatePoint[] }) {
  const max = 100;
  const latest = data[data.length - 1]?.rate ?? 98.7;
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase">Taux de réussite global</h3>
        <span className="text-2xl font-bold text-green-600">{latest}%</span>
      </div>
      <div className="flex items-end gap-2 h-24">
        {data.map((p) => (
          <div key={p.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(p.rate / max) * 100}%`, minHeight: 8 }} />
            <span className="text-[10px] text-gray-400">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
