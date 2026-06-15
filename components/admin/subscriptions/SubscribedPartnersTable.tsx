import React from 'react';
import { Icon } from '../../Icon';
import { SubscribedPartner, SubscriptionStatus } from '../../../lib/admin/subscriptions-types';

interface SubscribedPartnersTableProps {
  partners: SubscribedPartner[];
}

const statusConfig: Record<SubscriptionStatus, { label: string; color: string }> = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'En retard', color: 'bg-orange-100 text-orange-700' },
  suspended: { label: 'Suspendu', color: 'bg-red-100 text-red-700' },
  trial: { label: 'Essai', color: 'bg-blue-100 text-blue-700' },
};

export const SubscribedPartnersTable: React.FC<SubscribedPartnersTableProps> = ({ partners }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">Partenaires abonnés</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Partenaire</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Plan</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Début</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Renouvellement</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">MRR</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Statut</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => {
              const status = statusConfig[partner.status];
              return (
                <tr key={partner.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{partner.name}</td>
                  <td className="px-4 py-3 text-gray-700">{partner.plan}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{partner.startDate}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{partner.renewalDate}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">${partner.mrr.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <Icon name="bars3" className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
