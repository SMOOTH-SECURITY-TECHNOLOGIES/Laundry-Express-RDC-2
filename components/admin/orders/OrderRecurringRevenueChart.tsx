import type { OrderRevenueData } from '../../../lib/admin/orders-types';

interface OrderRecurringRevenueChartProps {
  data: OrderRevenueData;
}

export function OrderRecurringRevenueChart({ data }: OrderRecurringRevenueChartProps) {
  if (!data.monthly.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full flex items-center justify-center text-sm text-gray-400">
        Aucune donnée de revenus
      </div>
    );
  }

  const max = Math.max(...data.monthly.map((m) => m.value), 1);
  const points = data.monthly
    .map((m, i) => {
      const x = data.monthly.length === 1 ? 0 : (i / (data.monthly.length - 1)) * 200;
      const y = 60 - (m.value / max) * 50;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Revenus récurrents</h3>
          <p className="text-xs text-gray-500">MRR sur 12 mois</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold text-gray-900">${data.mrr.toLocaleString('fr-FR')}</p>
          <span className="text-xs font-bold text-green-600">+{data.mrrChange}%</span>
        </div>
      </div>
      <svg viewBox="0 0 220 70" className="w-full h-16">
        <path d="M0 60 H220" stroke="#e5e7eb" strokeWidth="1" />
        <path
          d={`M${points}`}
          fill="none"
          stroke="#0B5FFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.monthly.map((m, i) => {
          const x = data.monthly.length === 1 ? 0 : (i / (data.monthly.length - 1)) * 200;
          const y = 60 - (m.value / max) * 50;
          return <circle key={m.month} cx={x} cy={y} r="2.5" fill="#0B5FFF" />;
        })}
      </svg>
      <div className="flex justify-between mt-2">
        {data.monthly.map((m) => (
          <span key={m.month} className="text-[8px] text-content-muted">
            {m.month}
          </span>
        ))}
      </div>
    </div>
  );
}
