import React from 'react';
import { Icon } from '../../Icon';
import type { OrderInvoiceKpis } from '../../../lib/admin/orders-types';

interface OrderInvoiceWidgetProps {
  data: OrderInvoiceKpis;
}

const fmt = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toLocaleString()}`;

export const OrderInvoiceWidget: React.FC<OrderInvoiceWidgetProps> = ({ data }) => {
  const kpis = [
    {
      label: 'Factures émises',
      value: data.issued,
      icon: 'document-text' as const,
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Payées',
      value: data.paid,
      icon: 'check' as const,
      bg: 'bg-green-50',
      text: 'text-green-600',
    },
    {
      label: 'En retard',
      value: data.overdue,
      icon: 'exclamation-circle' as const,
      bg: 'bg-red-50',
      text: 'text-red-600',
    },
    {
      label: 'Montant recouvré',
      value: data.collected,
      icon: 'currencyDollar' as const,
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      isCurrency: true,
    },
  ];

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border-subtle shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-content-primary">Facturation</h3>
          <p className="text-xs text-content-muted">Suivi des factures et encaissements.</p>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Détails
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-xl border border-surface-border-subtle p-4 ${kpi.bg}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon name={kpi.icon} className={`w-5 h-5 ${kpi.text}`} />
              <span className="text-xs font-medium text-content-muted">{kpi.label}</span>
            </div>
            <p className={`text-2xl font-extrabold ${kpi.text}`}>
              {kpi.isCurrency ? fmt(kpi.value) : kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-surface-border-subtle">
        <div className="flex items-center justify-between text-xs">
          <span className="text-content-muted">Taux de recouvrement</span>
          <span className="font-bold text-content-primary">
            {data.issued > 0 ? Math.round((data.paid / data.issued) * 100) : 0}%
          </span>
        </div>
        <div className="mt-2 w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{
              width: `${data.issued > 0 ? (data.paid / data.issued) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
