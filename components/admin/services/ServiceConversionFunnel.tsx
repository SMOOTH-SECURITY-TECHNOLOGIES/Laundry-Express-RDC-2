import React from 'react';
import { Icon } from '../../Icon';
import { formatNumber } from '../../../lib/admin/services-formatters';

interface AdminServiceFunnelStep {
  label: string;
  value: number;
  color: string;
}

interface ServiceConversionFunnelProps {
  funnel: AdminServiceFunnelStep[];
}

export default function ServiceConversionFunnel({ funnel }: ServiceConversionFunnelProps) {
  const maxValue = funnel.length > 0 ? Math.max(...funnel.map(s => s.value)) : 1;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon name="chartBar" className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Entonnoir de Conversion</h3>
      </div>
      <div className="space-y-4">
        {funnel.map((step, index) => {
          const widthPercent = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
          const conversionRate = index > 0 && funnel[index - 1].value > 0
            ? ((step.value / funnel[index - 1].value) * 100).toFixed(1)
            : '100.0';

          return (
            <div key={index} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-700 text-right truncate">
                {step.label}
              </div>
              <div className="flex-1 relative">
                <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500 ease-out"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: step.color,
                    }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(step.value)}
                  </span>
                </div>
              </div>
              {index > 0 && (
                <div className="w-16 text-right">
                  <span className="text-xs text-gray-500">
                    {conversionRate}%
                  </span>
                </div>
              )}
              {index === 0 && <div className="w-16" />}
            </div>
          );
        })}
      </div>
      {funnel.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Taux de conversion global</span>
            <span className="font-semibold text-gray-900">
              {funnel[0].value > 0
                ? ((funnel[funnel.length - 1].value / funnel[0].value) * 100).toFixed(1)
                : '0.0'}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}