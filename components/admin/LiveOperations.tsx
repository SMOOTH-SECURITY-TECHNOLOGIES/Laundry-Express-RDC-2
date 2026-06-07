import React from 'react';
import { Icon } from '../Icon';

interface Activity {
  time: string;
  action: string;
  ref: string;
  details: string;
  status: string;
  statusColor: string;
  icon: 'shoppingBag' | 'currencyDollar' | 'user' | 'truck' | 'check' | 'lifebuoy';
}

const activities: Activity[] = [
  { time: '10:12', action: 'Commande créée', ref: 'ORD-001', details: 'Jean M. - Gombe', status: 'Nouveau', statusColor: 'bg-blue-100 text-blue-700', icon: 'shoppingBag' },
  { time: '10:14', action: 'Paiement reçu', ref: 'ORD-001', details: 'Mobile Money', status: 'Payé', statusColor: 'bg-green-100 text-green-700', icon: 'currencyDollar' },
  { time: '10:16', action: 'Chauffeur assigné', ref: 'DRV-004', details: 'Koffi A.', status: 'Assigné', statusColor: 'bg-purple-100 text-purple-700', icon: 'user' },
  { time: '10:18', action: 'Collecte effectuée', ref: 'ORD-001', details: 'Prestige Pressing', status: 'En cours', statusColor: 'bg-orange-100 text-orange-700', icon: 'truck' },
  { time: '10:22', action: 'Livraison effectuée', ref: 'ORD-000', details: 'Jean M. - Gombe', status: 'Livrée', statusColor: 'bg-green-100 text-green-700', icon: 'check' },
  { time: '10:25', action: 'Ticket ouvert', ref: 'SUP-021', details: 'Paiement échoué', status: 'Ouvert', statusColor: 'bg-yellow-100 text-yellow-700', icon: 'lifebuoy' },
];

const notifyAdminAction = (message: string) => {
  window.dispatchEvent(new CustomEvent('admin-action', { detail: message }));
};

export const LiveOperations: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Activité en temps réel</h3>
        <button type="button" onClick={() => notifyAdminAction('Journal complet des opérations ouvert.')} className="text-xs font-medium text-blue-600 hover:text-blue-700">
          Voir tout
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider">Heure</th>
              <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider">Référence</th>
              <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider">Détails</th>
              <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activities.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 whitespace-nowrap">
                  <span className="text-xs text-gray-500">{item.time}</span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Icon name={item.icon} className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-900">{item.action}</span>
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <span className="text-xs font-mono text-gray-600">{item.ref}</span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <span className="text-xs text-gray-500">{item.details}</span>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.statusColor}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-gray-100">
        <button type="button" onClick={() => notifyAdminAction('Toutes les activités temps réel sont prêtes.')} className="text-xs font-medium text-blue-600 hover:text-blue-700">
          Voir toutes les activités
        </button>
      </div>
    </div>
  );
};
