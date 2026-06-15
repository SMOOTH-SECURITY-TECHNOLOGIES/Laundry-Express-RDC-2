import React from 'react';
import { Icon } from '../../Icon';
import type { RevenueImpact } from '../../../lib/admin/dispatcher-types';

interface RevenueImpactCardProps {
  revenue: RevenueImpact;
}

export function RevenueImpactCard({ revenue }: RevenueImpactCardProps) {
  const items = [
    { label: 'Revenu du jour', value: revenue.daily, icon: 'currencyDollar' as const, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Revenu semaine', value: revenue.weekly, icon: 'chartBar' as const, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Revenu mois', value: revenue.monthly, icon: 'wallet' as const, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Coût logistique', value: revenue.logisticsCost, icon: 'truck' as const, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Marge logistique', value: revenue.logisticsMargin, icon: 'arrow-path' as const, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="currencyDollar" className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">Revenue Impact</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <div key={item.label} className={`rounded-xl p-4 ${item.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name={item.icon} className={`w-4 h-4 ${item.color}`} />
              <span className="text-[10px] text-gray-500">{item.label}</span>
            </div>
            <p className={`text-lg font-bold ${item.color}`}>
              {item.value.toLocaleString('fr-FR')} $
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
