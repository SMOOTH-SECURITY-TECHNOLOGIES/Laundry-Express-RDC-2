import React from 'react';
import { Icon } from '../../Icon';
import type { DispatcherAnalytics as AnalyticsData } from '../../../lib/admin/dispatcher-types';

interface DispatcherAnalyticsProps {
  data: AnalyticsData;
}

export function DispatcherAnalytics({ data }: DispatcherAnalyticsProps) {
  const maxCount = Math.max(...data.missionsPerHour.map((h) => h.count), 1);

  const metrics = [
    { label: 'Temps moyen collecte', value: `${data.avgPickupMinutes} min`, icon: 'truck' as const },
    { label: 'Temps moyen livraison', value: `${data.avgDeliveryMinutes} min`, icon: 'mapPin' as const },
    { label: 'Taux retard', value: `${data.delayRate}%`, icon: 'warning' as const },
    { label: 'Taux annulation', value: `${data.cancellationRate}%`, icon: 'xmark' as const },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="chartBar" className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">Analytiques dispatch</h3>
      </div>

      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-3">Missions par heure</p>
        <div className="flex items-end gap-2 h-32">
          {data.missionsPerHour.map((hour) => (
            <div key={hour.hour} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-blue-500 rounded-t-md transition-all"
                style={{ height: `${(hour.count / maxCount) * 100}%`, minHeight: '4px' }}
                title={`${hour.count} missions`}
              />
              <span className="text-[9px] text-gray-400">{hour.hour}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-gray-50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon name={m.icon} className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-[10px] text-gray-500">{m.label}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
