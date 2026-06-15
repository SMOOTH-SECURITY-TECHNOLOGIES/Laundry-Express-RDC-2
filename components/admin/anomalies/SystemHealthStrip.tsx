import React from 'react';
import type { SystemHealthItem } from '../../../lib/admin/anomalies-types';
import { getHealthColors, getHealthLabel, getStatusDotColor } from '../../../lib/admin/anomalies-formatters';
import { Icon } from '../../Icon';

interface SystemHealthStripProps {
  items: SystemHealthItem[];
}

export default function SystemHealthStrip({ items }: SystemHealthStripProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
        System Health
      </h3>
      <div className="flex flex-wrap gap-4">
        {items.map((item) => {
          const colors = getHealthColors(item.status);
          return (
            <div
              key={item.name}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${colors.bg} ${colors.text} min-w-[180px]`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${colors.bg}`}>
                <Icon name={item.icon as any} className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className={`w-2 h-2 rounded-full ${getStatusDotColor(item.status)}`} />
                  {getHealthLabel(item.status)}
                </span>
                {item.lastChecked && (
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    Vérifié à {item.lastChecked}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
