import { Icon } from '../Icon';

interface AlertCard {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  message: string;
  subtext: string;
}

const alerts: AlertCard[] = [
  {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: 'exclamation-circle',
    message: '3 commandes hors SLA',
    subtext: 'Voir les détails',
  },
  {
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: 'warning',
    message: '2 partenaires inactifs',
    subtext: 'À réactiver',
  },
  {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: 'chatBubble',
    message: '5 tickets critiques',
    subtext: 'À traiter',
  },
  {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: 'truck',
    message: '8 chauffeurs disponibles',
    subtext: 'Voir la liste',
  },
  {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: 'check',
    message: 'Tous les services opérationnels',
    subtext: 'Système sain',
  },
];

export const AlertBar = () => {
  return (
    <div className="grid grid-cols-5 gap-3">
      {alerts.map((alert) => (
        <div
          key={alert.message}
          className={`rounded-xl border ${alert.borderColor} ${alert.bgColor} p-3 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-shadow`}
        >
          <div className={`shrink-0 ${alert.color}`}>
            <Icon name={alert.icon as any} className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`text-sm font-semibold ${alert.color} leading-tight`}>{alert.message}</span>
            <span className="text-xs text-gray-500 leading-tight">{alert.subtext}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
