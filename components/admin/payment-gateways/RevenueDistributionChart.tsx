import type { RevenueDistribution } from '../../../lib/admin/payment-gateways-types';

export function RevenueDistributionChart({ data, total }: { data: RevenueDistribution[]; total: number }) {
  const sum = data.reduce((s, d) => s + d.amount, 0) || total || 1;
  let offset = 0;
  const r = 40; const c = 2 * Math.PI * r;
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Répartition des revenus</h3>
      <div className="flex items-center gap-6">
        <svg width="100" height="100" viewBox="0 0 100 100">
          {data.map((d) => {
            const pct = (d.amount || 0) / sum;
            const dash = pct * c;
            const el = <circle key={d.label} cx="50" cy="50" r={r} fill="none" stroke={d.color} strokeWidth="18" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset} transform="rotate(-90 50 50)" />;
            offset += dash;
            return el;
          })}
        </svg>
        <div>
          <p className="text-2xl font-bold">{total.toLocaleString('fr-FR')} $</p>
          <ul className="mt-2 space-y-1 text-sm">
            {data.map((d) => (
              <li key={d.label} className="flex justify-between gap-4"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.label}</span><span className="font-semibold">{d.percent}%</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
