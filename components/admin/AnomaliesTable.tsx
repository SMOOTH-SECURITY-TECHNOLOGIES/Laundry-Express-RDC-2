import React from 'react';
import { Icon } from '../Icon';

interface Anomaly {
  type: string;
  ref: string;
  location: string;
  time: string;
  status: string;
  statusColor: string;
}

const anomalies: Anomaly[] = [
  { type: 'Paiement sans collecte', ref: 'ORD-1790', location: 'Gombe', time: '10:05', status: 'Nouveau', statusColor: 'bg-blue-100 text-blue-700' },
  { type: 'Collecte sans chauffeur', ref: 'ORD-1781', location: 'Limete', time: '09:52', status: 'Nouveau', statusColor: 'bg-blue-100 text-blue-700' },
  { type: 'Livraison retardée > SLA', ref: 'ORD-1779', location: 'Kinshasa', time: '09:40', status: 'En cours', statusColor: 'bg-orange-100 text-orange-700' },
  { type: 'Partenaire inactif', ref: 'PRES-045', location: 'Gombe', time: 'Hier', status: 'En cours', statusColor: 'bg-orange-100 text-orange-700' },
  { type: 'Double remboursement', ref: 'ORD-1775', location: 'Ngaliema', time: 'Hier', status: 'À investiguer', statusColor: 'bg-red-100 text-red-700' },
];

const notifyAdminAction = (message: string) => {
  window.dispatchEvent(new CustomEvent('admin-action', { detail: message }));
};

export const AnomaliesTable: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Icon name="exclamation-circle" className="w-5 h-5 text-orange-500" />
          <h3 className="text-sm font-semibold text-gray-900">Anomalies détectées</h3>
        </div>
        <button type="button" onClick={() => notifyAdminAction('Centre des anomalies ouvert.')} className="text-xs text-blue-600 font-medium hover:underline">Voir tout</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-xs font-medium text-gray-500">Type</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500">Référence</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500">Lieu</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500">Heure</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500">Statut</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {anomalies.map((a) => (
              <tr key={a.ref} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 text-sm text-gray-700">{a.type}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{a.ref}</td>
                <td className="px-5 py-3.5 text-sm text-gray-500">{a.location}</td>
                <td className="px-5 py-3.5 text-sm text-gray-500">{a.time}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${a.statusColor}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button type="button" onClick={() => notifyAdminAction(`Investigation ouverte pour ${a.ref}.`)} className="text-xs text-blue-600 font-medium hover:underline">Investiguer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-gray-100 text-center">
        <button type="button" onClick={() => notifyAdminAction('Toutes les anomalies sont prêtes à être consultées.')} className="text-xs text-blue-600 font-medium hover:underline">
          Voir toutes les anomalies
        </button>
      </div>
    </div>
  );
};
