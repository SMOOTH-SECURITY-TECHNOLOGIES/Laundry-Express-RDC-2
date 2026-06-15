import React from 'react';
import { Icon } from '../../Icon';

interface SubscriptionQuickActionsProps {
  onCreate: () => void;
}

const actions = [
  { id: 'create-plan', icon: 'plus' as const, label: 'Créer plan' },
  { id: 'manage-invoices', icon: 'document-text' as const, label: 'Gérer factures' },
  { id: 'view-subscribers', icon: 'users' as const, label: 'Voir abonnés' },
  { id: 'analyze-revenue', icon: 'chartBar' as const, label: 'Analyser revenus' },
  { id: 'audit-subscriptions', icon: 'shield-check' as const, label: 'Audit abonnements' },
  { id: 'export-catalog', icon: 'arrow-down-tray' as const, label: 'Exporter catalogue' },
];

export const SubscriptionQuickActions: React.FC<SubscriptionQuickActionsProps> = ({ onCreate }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Actions rapides</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={action.id === 'create-plan' ? onCreate : undefined}
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
