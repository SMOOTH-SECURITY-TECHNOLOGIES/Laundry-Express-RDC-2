import React from 'react';
import { Icon } from '../../Icon';
import type { AdminServiceRevenuePoint } from '../../../lib/admin/services-types';

interface ServiceRevenueChartProps {
  data: AdminServiceRevenuePoint[];
}

const LINES = [
  { key: 'Nettoyage à sec' as const, color: '#3B82F6' },
  { key: 'Lessive' as const, color: '#22C55E' },
  { key: 'Express' as const, color: '#A855F7' },
  { key: 'Cordonnerie' as const, color: '#F97316' },
  { key: 'Repassage' as const, color: '#EF4444' },
];

export default function ServiceRevenueChart({ data }: ServiceRevenueChartProps) {
  if (data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = 700;
  const height = 300;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = data.flatMap((d) => LINES.map((l) => d[l.key]));
  const maxVal = Math.max(...allValues);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const xStep = chartW / (data.length - 1 || 1);

  function getX(i: number) {
    return padding.left + i * xStep;
  }

  function getY(val: number) {
    return padding.top + chartH - ((val - minVal) / range) * chartH;
  }

  function buildPath(key: typeof LINES[number]['key']) {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(d[key])}`).join(' ');
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const val = minVal + range * pct;
    return { val, y: getY(val), label: `$${(val / 1000).toFixed(0)}K` };
  });

  const xLabels = data.map((d, i) => ({ x: getX(i), label: d.date.slice(5) }));

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="chartBar" className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Revenu par Service</h3>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          {LINES.map((line) => (
            <linearGradient key={line.key} id={`grad-${line.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line.color} stopOpacity="0.15" />
              <stop offset="100%" stopColor={line.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={width - padding.right}
              y2={tick.y}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray={i === 0 ? '0' : '4,4'}
            />
            <text x={padding.left - 8} y={tick.y + 4} textAnchor="end" className="text-[10px] fill-gray-500">
              {tick.label}
            </text>
          </g>
        ))}

        {xLabels.map((xl, i) => (
          <text key={i} x={xl.x} y={height - 10} textAnchor="middle" className="text-[10px] fill-gray-500">
            {xl.label}
          </text>
        ))}

        {LINES.map((line) => (
          <g key={line.key}>
            <path d={buildPath(line.key)} fill="none" stroke={line.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}

        {LINES.map((line) => (
          <path
            key={`area-${line.key}`}
            d={`${buildPath(line.key)} L${getX(data.length - 1)},${getY(0)} L${getX(0)},${getY(0)} Z`}
            fill={`url(#grad-${line.key})`}
          />
        ))}
      </svg>

      <div className="flex items-center justify-center gap-6 mt-4">
        {LINES.map((line) => (
          <div key={line.key} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />
            <span className="text-xs text-gray-600">{line.key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
