import React, { useState } from 'react';
import { Icon } from '../../Icon';
import { formatCurrency, formatPercent } from '../../../lib/admin/services-formatters';

interface AdminServiceRankingItem {
  rank: number;
  name: string;
  value: number;
  trend?: number;
}

interface TopServicesCardProps {
  rankings: Record<string, AdminServiceRankingItem[]>;
}

const tabs = [
  { key: 'revenus', label: 'Revenus', icon: 'currencyDollar' as const },
  { key: 'croissance', label: 'Croissance', icon: 'arrowRight' as const },
  { key: 'satisfaction', label: 'Satisfaction', icon: 'star' as const },
  { key: 'marge', label: 'Marge', icon: 'chartBar' as const },
];

const formatValue = (tab: string, value: number): string => {
  switch (tab) {
    case 'revenus':
      return formatCurrency(value);
    case 'croissance':
      return formatPercent(value);
    case 'satisfaction':
      return `${value.toFixed(1)}/5`;
    case 'marge':
      return formatPercent(value);
    default:
      return value.toString();
  }
};

const getTrendColor = (trend?: number): string => {
  if (trend === undefined) return 'text-gray-400';
  if (trend > 0) return 'text-green-600';
  if (trend < 0) return 'text-red-600';
  return 'text-gray-400';
};

const getTrendIcon = (trend?: number): any => {
  if (trend === undefined) return 'minus';
  if (trend > 0) return 'arrowRight';
  if (trend < 0) return 'arrowLeft';
  return 'minus';
};

export default function TopServicesCard({ rankings }: TopServicesCardProps) {
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  const currentRankings =
    rankings[activeTab] ||
    rankings[tabs.find((tab) => tab.key === activeTab)?.label || activeTab] ||
    [];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Icon name="star" className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Top Services</h3>
        </div>
      </div>
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Icon name={tab.icon as any} className="w-4 h-4" />
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>
      <div className="p-4">
        {currentRankings.length > 0 ? (
          <div className="space-y-3">
            {currentRankings.map((item) => (
              <div
                key={item.rank}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  item.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                  item.rank === 2 ? 'bg-gray-100 text-gray-600' :
                  item.rank === 3 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {item.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {formatValue(activeTab, item.value)}
                  </p>
                </div>
                {item.trend !== undefined && (
                  <div className={`flex items-center gap-1 ${getTrendColor(item.trend)}`}>
                    <Icon name={getTrendIcon(item.trend)} className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {item.trend > 0 ? '+' : ''}{formatPercent(item.trend)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Icon name="shoppingBag" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}
