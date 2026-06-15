import type { RefundTrendPoint } from '../../../lib/admin/disputes-types';

interface RefundTrendChartProps {
  data: RefundTrendPoint[];
}

export function RefundTrendChart({ data }: RefundTrendChartProps) {
  if (!data.length) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-gray-400">
        Aucune donnée de tendance
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const amounts = data.map((d) => d.amount);
  const maxAmount = Math.max(...amounts, 1);

  const points = data.map((d, i) => {
    const x = padding.left + (data.length === 1 ? 0 : i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.amount / maxAmount) * chartHeight;
    return { x, y, date: d.date, amount: d.amount };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  const gradientId = 'refundTrendGradient';

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, i) => {
    const value = (maxAmount / (tickCount - 1)) * i;
    const y = padding.top + chartHeight - (value / maxAmount) * chartHeight;
    return { value, y };
  });

  const xLabelInterval = Math.ceil(data.length / 6);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {yTicks.map((tick, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={tick.y}
            x2={padding.left + chartWidth}
            y2={tick.y}
            stroke="#E2E8F0"
            strokeDasharray="4 4"
          />
          <text x={padding.left - 8} y={tick.y + 4} textAnchor="end" className="fill-slate-400 text-xs">
            ${Math.round(tick.value)}
          </text>
        </g>
      ))}

      {points.map((p, i) =>
        i % xLabelInterval === 0 ? (
          <text key={i} x={p.x} y={padding.top + chartHeight + 20} textAnchor="middle" className="fill-slate-400 text-xs">
            {data[i].date.slice(5)}
          </text>
        ) : null
      )}

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#3B82F6" className="opacity-0 hover:opacity-100 transition-opacity" />
      ))}
    </svg>
  );
}
