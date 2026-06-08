import React from 'react';
import { Icon } from '../../Icon';
import type { AdminServiceMixItem } from '../../../lib/admin/services-types';
import { formatCurrency } from '../../../lib/admin/services-formatters';

interface ServiceMixChartProps {
  items: AdminServiceMixItem[];
  total: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export default function ServiceMixChart({ items, total }: ServiceMixChartProps) {
  const cx = 100;
  const cy = 100;
  const outerR = 80;
  const innerR = 50;

  let currentAngle = 0;
  const arcs = items.map((item) => {
    const angle = (item.percentage / 100) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    currentAngle = end;

    const outerStart = polarToCartesian(cx, cy, outerR, start);
    const outerEnd = polarToCartesian(cx, cy, outerR, end);
    const innerStart = polarToCartesian(cx, cy, innerR, end);
    const innerEnd = polarToCartesian(cx, cy, innerR, start);
    const largeArcFlag = angle > 180 ? 1 : 0;

    const path = [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}`,
      'Z',
    ].join(' ');

    return { ...item, path };
  });

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="chartBar" className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-900">Mix de Services</h3>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {arcs.map((arc, i) => (
              <path key={i} d={arc.path} fill={arc.color} className="transition-opacity hover:opacity-80" />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{formatCurrency(total)}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">{item.percentage}%</span>
                <span className="text-xs text-gray-500">{formatCurrency(item.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
