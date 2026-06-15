import React from 'react';
import { Icon } from '../../Icon';

interface ServiceQuickActionsProps {
  onCreate: () => void;
  onPricing: () => void;
}

export default function ServiceQuickActions({ onCreate, onPricing }: ServiceQuickActionsProps) {
  const actions = [
    {
      label: 'Créer service',
      icon: 'plus',
      onClick: onCreate,
      bgColor: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-white',
    },
    {
      label: 'Modifier prix',
      icon: 'tag',
      onClick: onPricing,
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white',
    },
    {
      label: 'Analyser rentabilité',
      icon: 'chart-bar',
      onClick: () => console.log('Analyze profitability'),
      bgColor: 'bg-purple-600 hover:bg-purple-700',
      textColor: 'text-white',
    },
    {
      label: 'Voir anomalies',
      icon: 'alert-triangle',
      onClick: () => console.log('View anomalies'),
      bgColor: 'bg-orange-600 hover:bg-orange-700',
      textColor: 'text-white',
    },
    {
      label: 'Audit Truth',
      icon: 'shield',
      onClick: () => console.log('Truth audit'),
      bgColor: 'bg-red-600 hover:bg-red-700',
      textColor: 'text-white',
    },
    {
      label: 'Exporter catalogue',
      icon: 'download',
      onClick: () => console.log('Export catalog'),
      bgColor: 'bg-gray-600 hover:bg-gray-700',
      textColor: 'text-white',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="sparkles" className="w-5 h-5 text-yellow-600" />
        <h3 className="text-lg font-semibold text-gray-900">Actions Rapides</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${action.bgColor} ${action.textColor} shadow-sm hover:shadow-md active:scale-[0.98]`}
          >
            <Icon name={action.icon as any} className="w-5 h-5" />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}