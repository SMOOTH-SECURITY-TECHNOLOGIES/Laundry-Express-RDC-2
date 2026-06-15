import React from 'react';
import { Icon } from '../../components/Icon';

const MOCK_ALERTS = [
  { id: 1, type: 'warning', message: 'Mission MSN-003 en retard de 15 min', time: 'Il y a 5 min' },
  { id: 2, type: 'info', message: 'Chauffeur Kabongo M. a terminé sa mission', time: 'Il y a 8 min' },
  { id: 3, type: 'danger', message: 'Zone Gombe : trafic intense signalé', time: 'Il y a 12 min' },
  { id: 4, type: 'success', message: '3 missions assignées automatiquement', time: 'Il y a 20 min' },
  { id: 5, type: 'warning', message: 'Stock de sacs bas au dépôt central', time: 'Il y a 30 min' },
];

const alertColors: Record<string, { bg: string; icon: string; dot: string }> = {
  warning: { bg: 'bg-yellow-50', icon: 'text-yellow-600', dot: 'bg-yellow-500' },
  info: { bg: 'bg-blue-50', icon: 'text-brand-blue', dot: 'bg-brand-blue' },
  danger: { bg: 'bg-red-50', icon: 'text-red-600', dot: 'bg-red-500' },
  success: { bg: 'bg-green-50', icon: 'text-green-600', dot: 'bg-green-500' },
};

export const OperationalAlerts: React.FC = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-content-primary flex items-center gap-2">
          <Icon name="bell" className="w-5 h-5 text-orange-600" />
          Alertes opérationnelles
        </h2>
        <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold">
          {MOCK_ALERTS.length} alertes
        </span>
      </div>
      <div className="space-y-3">
        {MOCK_ALERTS.map((alert) => {
          const colors = alertColors[alert.type] || alertColors.info;
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-xl border border-surface-border-subtle p-3 ${colors.bg}`}
            >
              <div className={`mt-2 h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-content-primary">{alert.message}</p>
                <p className="mt-1 text-xs font-medium text-content-muted">{alert.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OperationalAlerts;
