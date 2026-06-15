import React from 'react';
import { Icon } from '../../Icon';
import { PlanFeature } from '../../../lib/admin/subscriptions-types';

interface PlanComparisonTableProps {
  features: PlanFeature[];
}

export const PlanComparisonTable: React.FC<PlanComparisonTableProps> = ({ features }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">Comparaison des plans</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Fonctionnalité</th>
              <th className="text-center px-4 py-3">
                <div className="font-bold text-gray-900">Essentiel</div>
                <div className="text-xs text-gray-500">$29/mois</div>
              </th>
              <th className="text-center px-4 py-3">
                <div className="font-bold text-gray-900">Professionnel</div>
                <div className="text-xs text-gray-500">$79/mois</div>
              </th>
              <th className="text-center px-4 py-3">
                <div className="font-bold text-gray-900">Entreprise</div>
                <div className="text-xs text-gray-500">$199/mois</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr key={index} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-700 font-medium">{feature.name}</td>
                <td className="px-4 py-3 text-center">
                  {feature.essential ? (
                    <Icon name="check" className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <Icon name="xmark" className="w-5 h-5 text-red-400 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {feature.professional ? (
                    <Icon name="check" className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <Icon name="xmark" className="w-5 h-5 text-red-400 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {feature.enterprise ? (
                    <Icon name="check" className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <Icon name="xmark" className="w-5 h-5 text-red-400 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
