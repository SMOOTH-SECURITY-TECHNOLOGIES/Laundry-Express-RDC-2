import React from 'react';
import { Icon } from '../../Icon';
import type { OrderFunnelStep } from '../../../lib/admin/orders-types';

interface OrderFunnelProps {
  steps: OrderFunnelStep[];
}

export function OrderFunnel({ steps }: OrderFunnelProps) {
  const maxPercentage = steps.length > 0 ? steps[0].percentage : 100;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon name="chartBar" className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-bold text-gray-900">Entonnoir des commandes (30 jours)</h2>
      </div>

      <div className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const widthPercent = maxPercentage > 0 ? (step.percentage / maxPercentage) * 100 : 0;
          return (
            <div key={`${step.label}-${i}`} className="flex items-center gap-4">
              <div className="w-28 text-right shrink-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{step.label}</p>
              </div>
              <div className="flex-1 relative h-9">
                <div
                  className="absolute inset-y-0 left-0 rounded-r-lg flex items-center justify-end px-3 transition-all duration-500"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: step.color,
                    minWidth: '48px',
                  }}
                >
                  <span className="text-xs font-bold text-white drop-shadow-sm">
                    {step.value.toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
              <div className="w-14 text-right shrink-0">
                <span className="text-xs font-semibold text-gray-500">{step.percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {steps.length >= 2 && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-content-muted">
          <span>Taux de conversion global</span>
          <span className="font-bold text-gray-700">
            {steps[steps.length - 1].percentage}%
          </span>
        </div>
      )}
    </div>
  );
}
