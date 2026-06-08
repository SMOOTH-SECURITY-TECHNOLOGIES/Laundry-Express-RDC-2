import { AdminServiceAlert } from '../../../lib/admin/services-types';
import { Icon } from '../../Icon';

interface ServiceAlertsCardProps {
  alerts: AdminServiceAlert[];
}

export default function ServiceAlertsCard({ alerts }: ServiceAlertsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="bell" className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-900">Alertes importantes</h3>
        </div>
        <button className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
          Voir tout
        </button>
      </div>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="shrink-0 mt-0.5">
              <Icon
                name={alert.icon as 'warning' | 'exclamation-circle' | 'bell' | 'lifebuoy'}
                className={`w-5 h-5 ${alert.color}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${alert.color} bg-opacity-10`}>
                {alert.label}
              </span>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{alert.description}</p>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">Aucune alerte en cours</p>
        )}
      </div>
    </div>
  );
}
