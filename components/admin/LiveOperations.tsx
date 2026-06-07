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
    <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Activity Feed</h3>
          <p className="text-xs text-gray-500">Flux live des paiements, assignations et opérations.</p>
        </div>
        <button type="button" onClick={() => notifyAdminAction('Journal complet des opérations ouvert.')} className="text-xs font-medium text-blue-600 hover:text-blue-700">
          Voir tout
        </button>
      </div>
      <div className="max-h-[390px] space-y-1 overflow-y-auto p-3">
        {activities.map((item, idx) => (
          <button
            type="button"
            key={`${item.time}-${item.action}`}
            onClick={() => notifyAdminAction(`${item.action} ouvert : ${item.ref}`)}
            className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-gray-50"
          >
            <span className="mt-0.5 w-10 shrink-0 text-xs font-bold text-gray-500">{item.time}</span>
            <span className="relative flex flex-col items-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Icon name={item.icon} className="h-4 w-4" />
              </span>
              {idx < activities.length - 1 && <span className="mt-1 h-8 w-px bg-gray-100" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{item.action}</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.statusColor}`}>
                  {item.status}
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">{item.ref} · {item.details}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="px-6 py-3 border-t border-gray-100">
        <button type="button" onClick={() => notifyAdminAction('Toutes les activités temps réel sont prêtes.')} className="text-xs font-medium text-blue-600 hover:text-blue-700">
          Voir toutes les activités
        </button>
      </div>
    </div>
  );
};
