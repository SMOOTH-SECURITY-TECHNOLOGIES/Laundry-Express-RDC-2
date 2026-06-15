import React from 'react';
import { Icon } from '../../Icon';
import type { OrderRevenueBlock as OrderRevenueBlockData } from '../../../lib/admin/orders-types';

interface OrderRevenueBlockProps {
  data: OrderRevenueBlockData;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

export function OrderRevenueBlock({ data }: OrderRevenueBlockProps) {
  const kpis = [
    {
      label: 'CA brut',
      value: data.grossRevenue,
      change: 12.4,
      icon: 'currencyDollar' as const,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      label: 'Commissions',
      value: data.commissions,
      change: 8.2,
      icon: 'wallet' as const,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    {
      label: 'Remboursements',
      value: data.refunds,
      change: -3.1,
      icon: 'arrowLeft' as const,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
    {
      label: 'Net',
      value: data.net,
      change: 10.7,
      icon: 'badge-check' as const,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
    },
  ];

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon name="currencyDollar" className="w-5 h-5 text-content-muted" />
        <h2 className="text-lg font-bold text-content-primary">Revenus (aujourd&apos;hui)</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`rounded-xl border p-4 ${kpi.bg} ${kpi.border}`}>
            <div className="flex items-center justify-between mb-2">
              <Icon name={kpi.icon} className={`w-5 h-5 ${kpi.color}`} />
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  kpi.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {kpi.change >= 0 ? '+' : ''}{kpi.change}%
              </span>
            </div>
            <p className="text-xs text-content-muted mb-1">{kpi.label}</p>
            <p className="text-xl font-extrabold text-content-primary">{formatCurrency(kpi.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
