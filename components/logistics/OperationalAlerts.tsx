import React, { useState } from 'react';
import { Icon } from '../Icon';

const alerts = [
  { type: 'delay', label: 'Missions en retard', count: 3, icon: 'warning' as const, color: 'text-red-500', bg: 'bg-red-50' },
  { type: 'waiting', label: 'Collectes en attente > 30 min', count: 2, icon: 'clock' as const, color: 'text-orange-500', bg: 'bg-orange-50' },
  { type: 'inactive', label: 'Chauffeurs inactifs', count: 4, icon: 'user' as const, color: 'text-gray-500', bg: 'bg-gray-50' },
  { type: 'payment', label: 'Paiements en attente', count: 6, icon: 'currencyDollar' as const, color: 'text-yellow-500', bg: 'bg-yellow-50' },
];

export const OperationalAlerts: React.FC = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalAlerts = alerts.reduce((sum, a) => sum + a.count, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-900">Alertes opérationnelles</h3>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
            {totalAlerts}
          </span>
        </div>
        <Icon name="bell" className="w-4 h-4 text-gray-400" />
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const isExpanded = expanded === alert.type;
          return (
            <div key={alert.type}>
              <button
                onClick={() => setExpanded(isExpanded ? null : alert.type)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${alert.bg} flex items-center justify-center`}>
                  <Icon name={alert.icon} className={`w-5 h-5 ${alert.color}`} />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-700">{alert.label}</span>
                <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${alert.bg} ${alert.color}`}>
                  {alert.count}
                </span>
                <Icon
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  className="w-4 h-4 text-gray-400 flex-shrink-0"
                />
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 pt-1">
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                    {alert.type === 'delay' && (
                      <ul className="space-y-1.5">
                        <li className="flex items-center justify-between">
                          <span>Mission #1042 - Lubumbashi</span>
                          <span className="text-red-500 font-medium">+15 min</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Mission #1039 - Kolwezi</span>
                          <span className="text-red-500 font-medium">+22 min</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Mission #1045 - Likasi</span>
                          <span className="text-red-500 font-medium">+8 min</span>
                        </li>
                      </ul>
                    )}
                    {alert.type === 'waiting' && (
                      <ul className="space-y-1.5">
                        <li className="flex items-center justify-between">
                          <span>Collecte #891 - Kinshasa</span>
                          <span className="text-orange-500 font-medium">35 min</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Collecte #894 - Matadi</span>
                          <span className="text-orange-500 font-medium">42 min</span>
                        </li>
                      </ul>
                    )}
                    {alert.type === 'inactive' && (
                      <ul className="space-y-1.5">
                        <li className="flex items-center justify-between">
                          <span>J. Mbuyi</span>
                          <span className="text-gray-400">Inactif 1h</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>K. Tshimanga</span>
                          <span className="text-gray-400">Inactif 45 min</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>P. Kabongo</span>
                          <span className="text-gray-400">Inactif 2h</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>A. Ngoy</span>
                          <span className="text-gray-400">Inactif 30 min</span>
                        </li>
                      </ul>
                    )}
                    {alert.type === 'payment' && (
                      <ul className="space-y-1.5">
                        <li className="flex items-center justify-between">
                          <span>Paiement #445</span>
                          <span className="text-yellow-500 font-medium">75.00 $</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Paiement #451</span>
                          <span className="text-yellow-500 font-medium">120.00 $</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Paiement #458</span>
                          <span className="text-yellow-500 font-medium">45.00 $</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Paiement #462</span>
                          <span className="text-yellow-500 font-medium">90.00 $</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Paiement #467</span>
                          <span className="text-yellow-500 font-medium">65.00 $</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Paiement #470</span>
                          <span className="text-yellow-500 font-medium">110.00 $</span>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <button className="w-full text-center text-sm font-medium text-brand-blue hover:text-brand-dark transition-colors">
          Voir toutes les alertes
        </button>
      </div>
    </div>
  );
};
