import React from 'react';
import { Icon } from '../../Icon';

const actions = [
  { id: 'search-order', icon: 'search' as const, label: 'Rechercher commande' },
  { id: 'order-truth', icon: 'shield-check' as const, label: 'Ouvrir Order Truth' },
  { id: 'anomaly-center', icon: 'warning' as const, label: 'Ouvrir Anomaly Center' },
  { id: 'create-investigation', icon: 'plus' as const, label: 'Créer Investigation' },
  { id: 'export-report', icon: 'arrow-down-tray' as const, label: 'Exporter rapport' },
  { id: 'auto-audit', icon: 'sparkles' as const, label: 'Audit automatique' },
];

export const AnomalyQuickActions: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Actions rapides</h3>
      <div className="grid grid-cols-3 gap-2">
        {actions.map(action => (
          <button
            key={action.id}
            className="bg-gray-50 rounded-xl p-3 text-center hover:bg-gray-100 transition-colors"
          >
            <Icon name={action.icon} className="w-5 h-5 text-gray-600 mx-auto mb-1" />
            <span className="text-[11px] font-medium text-gray-700 leading-tight block">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
