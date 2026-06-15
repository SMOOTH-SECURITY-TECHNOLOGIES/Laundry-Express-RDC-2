import React from 'react';
import { Icon } from '../../Icon';
import type { OrderPartner } from '../../../lib/admin/orders-types';

interface OrderPartnersTableProps {
  partners: OrderPartner[];
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="star"
          className={`w-3.5 h-3.5 ${
            star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'
          }`}
        />
      ))}
      <span className="ml-1 text-xs font-bold text-gray-700">{rating.toFixed(1)}</span>
    </div>
  );
}

function SlaBar({ sla }: { sla: number }) {
  const color =
    sla >= 95 ? 'bg-green-500' : sla >= 90 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${sla}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700">{sla}%</span>
    </div>
  );
}

export const OrderPartnersTable: React.FC<OrderPartnersTableProps> = ({ partners }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Partenaires</h3>
          <p className="text-xs text-gray-500">Performance et charge des partenaires actifs.</p>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Voir tout
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Partenaire
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Commandes actives
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                SLA
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Livraisons en cours
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Note
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {partners.map((partner) => (
              <tr
                key={partner.name}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                      <Icon name="building" className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-semibold text-gray-900">{partner.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                    {partner.activeOrders}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <SlaBar sla={partner.sla} />
                </td>
                <td className="px-6 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Icon name="truck" className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold text-gray-700">
                      {partner.deliveriesInProgress}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <RatingStars rating={partner.rating} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {partners.length === 0 && (
        <div className="px-6 py-12 text-center">
          <Icon name="building" className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucun partenaire actif.</p>
        </div>
      )}
    </div>
  );
};
