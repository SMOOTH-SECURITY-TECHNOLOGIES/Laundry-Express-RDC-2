import React from 'react';
import { Icon } from '../../Icon';
import { formatNumber } from '../../../lib/admin/services-formatters';

interface AdminServiceWatchItem {
  service?: string;
  name?: string;
  problem: string;
  sla: string | number;
  anomalies: number;
  impact: 'high' | 'medium' | 'low' | string;
}

interface ServiceWatchlistProps {
  items: AdminServiceWatchItem[];
}

const impactConfig = {
  high: { label: 'Élevé', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  medium: { label: 'Moyen', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  low: { label: 'Faible', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  Élevé: { label: 'Élevé', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  Moyen: { label: 'Moyen', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  Faible: { label: 'Faible', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
};

export default function ServiceWatchlist({ items }: ServiceWatchlistProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Icon name="search" className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Liste de Surveillance</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Problème
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SLA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Anomalies
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impact
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, index) => {
              const impact = impactConfig[item.impact as keyof typeof impactConfig] || impactConfig.medium;
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{item.service || item.name || 'Service'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{item.problem}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{item.sla}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.anomalies > 5 ? 'bg-red-100 text-red-800' :
                      item.anomalies > 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {formatNumber(item.anomalies)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${impact.bg} ${impact.text} border ${impact.border}`}>
                      {impact.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length === 0 && (
        <div className="px-6 py-12 text-center">
          <Icon name="check" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Aucun service en surveillance</p>
        </div>
      )}
    </div>
  );
}
