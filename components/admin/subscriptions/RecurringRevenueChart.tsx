const monthlyData = [
  { month: "Jan", mrr: 12000 },
  { month: "Fév", mrr: 13500 },
  { month: "Mar", mrr: 14200 },
  { month: "Avr", mrr: 15800 },
  { month: "Mai", mrr: 16500 },
  { month: "Juin", mrr: 18000 },
  { month: "Juil", mrr: 19200 },
  { month: "Août", mrr: 20100 },
  { month: "Sep", mrr: 21500 },
  { month: "Oct", mrr: 22000 },
  { month: "Nov", mrr: 22200 },
  { month: "Déc", mrr: 22450 },
];

export function RecurringRevenueChart() {
  const width = 700;
  const height = 280;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxMrr = Math.max(...monthlyData.map((d) => d.mrr));
  const minMrr = Math.min(...monthlyData.map((d) => d.mrr));
  const range = maxMrr - minMrr;

  const getX = (index: number) => padding.left + (index / (monthlyData.length - 1)) * chartWidth;
  const getY = (value: number) => padding.top + chartHeight - ((value - minMrr) / range) * chartHeight;

  const linePoints = monthlyData
    .map((d, i) => `${getX(i)},${getY(d.mrr)}`)
    .join(" ");

  const areaPoints = [
    `${getX(0)},${padding.top + chartHeight}`,
    ...monthlyData.map((d, i) => `${getX(i)},${getY(d.mrr)}`),
    `${getX(monthlyData.length - 1)},${padding.top + chartHeight}`,
  ].join(" ");

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => {
    const value = minMrr + (range / yTicks) * i;
    return Math.round(value / 1000) * 1000;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-6">
        Revenu récurrent mensuel (MRR)
      </h3>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="mrrGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTickValues.map((value, index) => (
          <g key={value}>
            <line
              x1={padding.left}
              y1={getY(value)}
              x2={width - padding.right}
              y2={getY(value)}
              stroke="#e5e7eb"
              strokeDasharray="4"
            />
            <text x={padding.left - 10} y={getY(value) + 4} textAnchor="end" className="text-xs fill-gray-500">
              ${(value / 1000).toFixed(0)}K
            </text>
          </g>
        ))}

        <polygon points={areaPoints} fill="url(#mrrGradient)" />
        <polyline points={linePoints} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {monthlyData.map((d, i) => (
          <circle key={d.month} cx={getX(i)} cy={getY(d.mrr)} r="4" fill="#6366f1" stroke="white" strokeWidth="2" />
        ))}

        {monthlyData.map((d, i) => (
          <text key={d.month} x={getX(i)} y={height - 10} textAnchor="middle" className="text-xs fill-gray-500">
            {d.month}
          </text>
        ))}
      </svg>
    </div>
  );
}
