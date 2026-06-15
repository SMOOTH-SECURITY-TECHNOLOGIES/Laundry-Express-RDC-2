import React from 'react';
import { Icon } from '../../Icon';
import type { AdminServicePerformance } from '../../../lib/admin/services-types';
import { formatCurrency } from '../../../lib/admin/services-formatters';

interface ServicePerformanceTableProps {
  services: AdminServicePerformance[];
}

function SlaBar({ value }: { value: number }) {
  const color = value >= 95 ? 'bg-green-500' : value >= 85 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-surface-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-sm font-medium text-content-primary">{value}%</span>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="star"
          className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
      <span className="text-sm text-gray-600 ml-1">{rating}</span>
    </div>
  );
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  pressing: { bg: 'bg-blue-100', text: 'text-blue-800' },
  blanchisserie: { bg: 'bg-green-100', text: 'text-green-800' },
  livraison: { bg: 'bg-purple-100', text: 'text-purple-800' },
  reparation: { bg: 'bg-orange-100', text: 'text-orange-800' },
  repassage: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
};

export default function ServicePerformanceTable({ services }: ServicePerformanceTableProps) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="chartBar" className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Performance des Services</h3>
        </div>
        <button className="text-sm text-purple-600 hover:text-purple-800 font-medium">
          Voir tous les services →
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Service</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Catégorie</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Revenu (30j)</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Commandes</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">SLA</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Note</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Croissance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {services.map((service) => {
              const catColor = categoryColors[service.category] || { bg: 'bg-gray-100', text: 'text-gray-800' };
              return (
                <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-gray-900">{service.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${catColor.bg} ${catColor.text}`}>
                      {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(service.revenue)}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm text-gray-700">{service.orders.toLocaleString('fr-FR')}</span>
                  </td>
                  <td className="py-3 px-4">
                    <SlaBar value={service.sla} />
                  </td>
                  <td className="py-3 px-4">
                    <StarRating rating={service.rating} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${service.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <Icon
                        name={service.growth >= 0 ? 'chevron-up' : 'chevron-down'}
                        className="w-4 h-4"
                      />
                      {`${service.growth > 0 ? '+' : ''}${service.growth}%`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
