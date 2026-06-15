import React from 'react';
import { Icon } from '../../Icon';
import type { OrderAnomaly } from '../../../lib/admin/orders-types';

interface OrderAnomalyCenterProps {
  anomalies: OrderAnomaly[];
}

const colorMap: Record<string, { bg: string; border: string; iconColor: string; badge: string }> = {
  red: { bg: 'bg-red-50', border: 'border-l-red-500', iconColor: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  orange: { bg: 'bg-orange-50', border: 'border-l-orange-500', iconColor: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  yellow: { bg: 'bg-yellow-50', border: 'border-l-yellow-500', iconColor: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  blue: { bg: 'bg-blue-50', border: 'border-l-blue-500', iconColor: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  green: { bg: 'bg-green-50', border: 'border-l-green-500', iconColor: 'text-green-600', badge: 'bg-green-100 text-green-700' },
  purple: { bg: 'bg-purple-50', border: 'border-l-purple-500', iconColor: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
};

const iconFallbacks: Record<string, string> = {
  'exclamation-circle': 'exclamation-circle',
  warning: 'warning',
  clock: 'clock',
  truck: 'truck',
  shield: 'shield',
};

export function OrderAnomalyCenter({ anomalies }: OrderAnomalyCenterProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Icon name="exclamation-circle" className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Anomalies détectées</h2>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
          {anomalies.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {anomalies.map((anomaly) => {
          const scheme = colorMap[anomaly.color] ?? colorMap.blue;
          const iconName = iconFallbacks[anomaly.icon] ?? 'exclamation-circle';

          return (
            <div
              key={anomaly.id}
              className={`flex items-center gap-4 rounded-xl border border-l-4 p-4 ${scheme.bg} ${scheme.border}`}
            >
              <div className={`shrink-0 ${scheme.iconColor}`}>
                <Icon name={iconName as any} className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{anomaly.title}</p>
              </div>

              <span className={`shrink-0 inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${scheme.badge}`}>
                {anomaly.count}
              </span>

              <button
                type="button"
                className="shrink-0 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Investiguer
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
