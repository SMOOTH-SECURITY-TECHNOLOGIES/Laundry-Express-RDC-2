import React from 'react';
import { Icon } from '../../Icon';

interface QuickAction {
  label: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  tone: string;
  onClick?: () => void;
}

interface InvestigateQuickActionsProps {
  onOpenOrderTruth?: () => void;
  onExport?: () => void;
  onCreateInvestigation?: () => void;
}

export const InvestigateQuickActions: React.FC<InvestigateQuickActionsProps> = ({
  onOpenOrderTruth,
  onExport,
  onCreateInvestigation,
}) => {
  const actions: QuickAction[] = [
    { label: 'Ouvrir Order Truth', icon: 'shield-check', onClick: onOpenOrderTruth, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: 'Créer ticket support', icon: 'lifebuoy', tone: 'bg-green-50 text-green-700 border-green-100' },
    { label: 'Créer anomalie', icon: 'warning', tone: 'bg-red-50 text-red-700 border-red-100' },
    { label: 'Escalader finance', icon: 'currencyDollar', tone: 'bg-purple-50 text-purple-700 border-purple-100' },
    { label: 'Escalader logistique', icon: 'truck', tone: 'bg-orange-50 text-orange-700 border-orange-100' },
    { label: 'Exporter rapport PDF', icon: 'arrow-down-tray', onClick: onExport, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: 'Créer investigation', icon: 'plus', onClick: onCreateInvestigation, tone: 'bg-gray-50 text-gray-700 border-gray-200' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
        ACTIONS RAPIDES
      </h3>

      <div className="grid gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            type="button"
            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${action.tone}`}
          >
            <Icon name={action.icon} className="h-5 w-5 shrink-0" />
            <span className="text-xs font-extrabold leading-tight">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
