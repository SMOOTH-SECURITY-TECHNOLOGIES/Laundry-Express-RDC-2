import React from 'react';
import { Icon } from '../../Icon';
import type { OrderActivity } from '../../../lib/admin/orders-types';

interface OrderActivityStreamProps {
  activities: OrderActivity[];
}

const iconMap: Record<string, OrderActivity['icon']> = {
  check_circle: 'check',
  gavel: 'exclamation-circle',
  done_all: 'check',
  person_add: 'user',
  payments: 'currencyDollar',
  schedule: 'clock',
  payment: 'credit-card',
  block: 'warning',
  local_shipping: 'truck',
};

const colorMap: Record<string, { bg: string; text: string }> = {
  '#22C55E': { bg: 'bg-green-50', text: 'text-green-600' },
  '#EF4444': { bg: 'bg-red-50', text: 'text-red-600' },
  '#3B82F6': { bg: 'bg-blue-50', text: 'text-blue-600' },
  '#14B8A6': { bg: 'bg-teal-50', text: 'text-teal-600' },
  '#F59E0B': { bg: 'bg-amber-50', text: 'text-amber-600' },
  '#8B5CF6': { bg: 'bg-violet-50', text: 'text-violet-600' },
  '#F97316': { bg: 'bg-orange-50', text: 'text-orange-600' },
};

function getIconName(raw: string): 'check' | 'exclamation-circle' | 'user' | 'currencyDollar' | 'clock' | 'credit-card' | 'warning' | 'truck' {
  return (iconMap[raw] || 'check') as 'check' | 'exclamation-circle' | 'user' | 'currencyDollar' | 'clock' | 'credit-card' | 'warning' | 'truck';
}

function getColorClasses(color: string) {
  return colorMap[color] || { bg: 'bg-gray-50', text: 'text-gray-600' };
}

export const OrderActivityStream: React.FC<OrderActivityStreamProps> = ({ activities }) => {
  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border-subtle shadow-sm">
      <div className="px-6 py-4 border-b border-surface-border-subtle flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-content-primary">Activité récente</h3>
          <p className="text-xs text-content-muted">Flux des dernières actions sur les commandes.</p>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Tout voir
        </button>
      </div>

      <div className="max-h-[380px] overflow-y-auto">
        {activities.map((item, idx) => {
          const colors = getColorClasses(item.color);
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 px-6 py-3 hover:bg-surface-muted transition-colors"
            >
              <div className="flex flex-col items-center">
                <span
                  className={`flex w-8 h-8 items-center justify-center rounded-full ${colors.bg}`}
                >
                  <Icon name={getIconName(item.icon)} className={`w-4 h-4 ${colors.text}`} />
                </span>
                {idx < activities.length - 1 && (
                  <span className="mt-1 w-px h-6 bg-gray-100" />
                )}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-content-primary">{item.action}</span>
                </div>
                <p className="text-xs text-content-muted mt-0.5">{item.detail}</p>
              </div>

              <span className="shrink-0 text-[10px] font-medium text-content-muted pt-1">
                {item.time}
              </span>
            </div>
          );
        })}
      </div>

      {activities.length === 0 && (
        <div className="px-6 py-12 text-center">
          <Icon name="clock" className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune activité récente.</p>
        </div>
      )}
    </div>
  );
};
