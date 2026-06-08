import React from 'react';
import { Icon } from '../../Icon';
import { formatCurrency } from '../../../lib/admin/services-formatters';

interface AdminServiceCatalogItem {
  name: string;
  category: string;
  partnerCount: number;
  averagePrice: number;
  status: string;
}

interface ServiceInventoryTableProps {
  catalog: AdminServiceCatalogItem[];
}

const statusConfig = {
  active: { label: 'Actif', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  pending: { label: 'En attente', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  inactive: { label: 'Inactif', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
};

const categoryConfig: Record<string, { bg: string; text: string }> = {
  'Lavage': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Pressing': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'Retouche': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'Tapis': { bg: 'bg-teal-100', text: 'text-teal-800' },
  'Drap': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  'Spécial': { bg: 'bg-pink-100', text: 'text-pink-800' },
};

const getCategoryStyle = (category: string) => {
  return categoryConfig[category] || { bg: 'bg-gray-100', text: 'text-gray-800' };
};

export default function ServiceInventoryTable({ catalog }: ServiceInventoryTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Icon name="shoppingBag" className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Inventaire des Services</h3>
          <span className="ml-auto text-sm text-gray-500">
            {catalog.length} service{catalog.length !== 1 ? 's' : ''}
          </span>
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
                Catégorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Partenaires
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix moyen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {catalog.map((item, index) => {
              const status = statusConfig[item.status];
              const category = getCategoryStyle(item.category);
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Icon name="shirt" className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.bg} ${category.text}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Icon name="users" className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{item.partnerCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.averagePrice)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {catalog.length === 0 && (
        <div className="px-6 py-12 text-center">
          <Icon name="shoppingBag" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Aucun service dans le catalogue</p>
        </div>
      )}
    </div>
  );
}