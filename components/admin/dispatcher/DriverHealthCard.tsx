import React from 'react';
import { Icon } from '../../Icon';
import type { DriverHealth } from '../../../lib/admin/dispatcher-types';

interface DriverHealthCardProps {
  health: DriverHealth;
}

export function DriverHealthCard({ health }: DriverHealthCardProps) {
  const items = [
    { label: 'Disponibles', value: health.available, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: 'badge-check' as const },
    { label: 'Occupés', value: health.busy, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: 'truck' as const },
    { label: 'Hors ligne', value: health.offline, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: 'circle' as const },
    { label: 'En pause', value: health.pause, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: 'minus' as const },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="heart" className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">Driver Health</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className={`rounded-xl border p-4 ${item.bg} ${item.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name={item.icon} className={`w-4 h-4 ${item.color}`} />
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
