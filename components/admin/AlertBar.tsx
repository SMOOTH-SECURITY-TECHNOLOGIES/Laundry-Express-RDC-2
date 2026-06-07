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
  const criticalAlerts = alerts.filter((alert) => !alert.color.includes('green'));

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Icon name="warning" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900">Command Center</p>
              <p className="text-xs text-gray-500">Priorités opérationnelles consolidées avant dispatch.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:flex xl:items-center">
            {criticalAlerts.map((alert) => (
              <button
                type="button"
                key={`banner-${alert.message}`}
                className={`inline-flex items-center gap-2 rounded-full border ${alert.borderColor} ${alert.bgColor} px-3 py-2 text-left text-xs font-bold ${alert.color}`}
              >
                <Icon name={alert.icon as any} className="h-4 w-4 shrink-0" />
                {alert.message}
              </button>
            ))}
            <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Système opérationnel
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
    </div>
  );
};
