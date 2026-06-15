import React from 'react';
import { Icon } from '../../Icon';
import { SubscriptionActivity as SubscriptionActivityType } from '../../../lib/admin/subscriptions-types';

interface SubscriptionActivityProps {
  activities: SubscriptionActivityType[];
}

const colorMap: Record<string, string> = {
  green: 'bg-green-100 text-green-600',
  blue: 'bg-blue-100 text-blue-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  gray: 'bg-gray-100 text-gray-600',
};

export const SubscriptionActivity: React.FC<SubscriptionActivityProps> = ({ activities }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Activité récente</h3>
      <div className="space-y-4">
        {activities.map((activity) => {
          const badgeColor = colorMap[activity.color] ?? 'bg-gray-100 text-gray-600';
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${badgeColor}`}>
                <Icon name={activity.icon as any} className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-gray-900">{activity.time}</span>
                  <span className="text-sm font-medium text-gray-800">{activity.user}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{activity.action}</p>
                <p className="text-xs text-gray-400 mt-0.5">{activity.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
