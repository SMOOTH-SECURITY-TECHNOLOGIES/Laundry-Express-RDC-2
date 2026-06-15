import { Icon } from '../../Icon';

interface DisputeQuickActionsProps {
  onAction: (action: string) => void;
  readOnly?: boolean;
}

interface ActionButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  disabled?: boolean;
  tooltip?: string;
}

export function DisputeQuickActions({ onAction, readOnly }: DisputeQuickActionsProps) {
  const actions: ActionButton[] = [
    {
      id: 'create',
      label: 'Nouvelle demande manuelle',
      icon: <Icon name="plus" className="w-5 h-5" />,
      iconBg: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
    },
    {
      id: 'critical',
      label: 'Voir litiges critiques',
      icon: <Icon name="warning" className="w-5 h-5" />,
      iconBg: 'bg-red-100 text-red-600 hover:bg-red-200',
    },
    {
      id: 'investigate_anomalies',
      label: 'Investiguer anomalies',
      icon: <Icon name="shield-check" className="w-5 h-5" />,
      iconBg: 'bg-orange-100 text-orange-600 hover:bg-orange-200',
    },
    {
      id: 'audit',
      label: 'Auditer litiges',
      icon: <Icon name="document-text" className="w-5 h-5" />,
      iconBg: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
    },
    {
      id: 'export',
      label: 'Export litiges',
      icon: <Icon name="arrow-down-tray" className="w-5 h-5" />,
      iconBg: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    },
    {
      id: 'settings',
      label: 'Paramètres litiges',
      icon: <Icon name="settings" className="w-5 h-5" />,
      iconBg: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Actions rapides
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action.id)}
            disabled={action.disabled}
            title={readOnly && action.id === 'create' ? undefined : action.tooltip}
            className={`flex items-center gap-2.5 p-3 rounded-xl transition-colors text-left ${action.iconBg} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {action.icon}
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
