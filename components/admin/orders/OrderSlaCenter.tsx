import React from 'react';
import { Icon } from '../../Icon';
import type { OrderSlaData } from '../../../lib/admin/orders-types';

interface OrderSlaCenterProps {
  data: OrderSlaData;
}

const stats = [
  { key: 'inSla' as const, label: 'Dans SLA', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500' },
  { key: 'atRisk' as const, label: 'À risque', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-500' },
  { key: 'outOfSla' as const, label: 'Hors SLA', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-500' },
];

export function OrderSlaCenter({ data }: OrderSlaCenterProps) {
  const total = data.inSla + data.atRisk + data.outOfSla;
  const overallPercent = total > 0 ? Math.round(((data.inSla) / total) * 100) : 96;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { percent: data.inSlaPercent, color: '#22c55e', offset: 0 },
    { percent: data.atRiskPercent, color: '#f97316', offset: data.inSlaPercent },
    { percent: data.outOfSlaPercent, color: '#ef4444', offset: data.inSlaPercent + data.atRiskPercent },
  ];

  let cumulativeDashoffset = 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon name="clock" className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-bold text-gray-900">SLA commandes</h2>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="12"
            />
            {segments.map((seg) => {
              const dashLength = (seg.percent / 100) * circumference;
              const dashoffset = cumulativeDashoffset;
              cumulativeDashoffset += dashLength;
              return (
                <circle
                  key={seg.color}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="12"
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={-dashoffset}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-gray-900">{overallPercent}%</span>
            <span className="text-xs text-gray-500">Dans SLA</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const value = data[stat.key];
          const pctKey = (stat.key + 'Percent') as keyof OrderSlaData;
          const pct = data[pctKey] as number;
          return (
            <div key={stat.key} className={`rounded-xl border p-3 ${stat.bg} ${stat.border}`}>
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{value}</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className={`${stat.bar} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[10px] text-content-muted mt-1">{pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
