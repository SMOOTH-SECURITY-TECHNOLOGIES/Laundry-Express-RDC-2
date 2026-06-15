import React from 'react';
import { Icon } from '../../Icon';

interface OrderQuickActionsProps {
  onAction: (action: string) => void;
}

const actions = [
  { key: 'assign-pickup', label: 'Assigner collecte', icon: 'truck' as const, tone: 'bg-blue-50 text-blue-700 border-blue-100' },
  { key: 'assign-delivery', label: 'Assigner livraison', icon: 'mapPin' as const, tone: 'bg-green-50 text-green-700 border-green-100' },
  { key: 'view-disputes', label: 'Voir litiges', icon: 'exclamation-circle' as const, tone: 'bg-red-50 text-red-700 border-red-100' },
  { key: 'open-investigate', label: 'Ouvrir Investigation', icon: 'search' as const, tone: 'bg-purple-50 text-purple-700 border-purple-100' },
  { key: 'open-order-truth', label: 'Ouvrir Order Truth', icon: 'shield-check' as const, tone: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { key: 'export-orders', label: 'Exporter commandes', icon: 'arrow-down-tray' as const, tone: 'bg-slate-50 text-slate-700 border-slate-200' },
  { key: 'print-invoice', label: 'Imprimer facture', icon: 'document-text' as const, tone: 'bg-orange-50 text-orange-700 border-orange-100' },
  { key: 'audit-orders', label: 'Audit commandes', icon: 'shield' as const, tone: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
];

export const OrderQuickActions: React.FC<OrderQuickActionsProps> = ({ onAction }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Actions rapides</h3>
        <p className="text-xs text-gray-500">Raccourcis opérationnels commandes.</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((a) => (
          <button
            type="button"
            key={a.key}
            onClick={() => onAction(a.key)}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${a.tone}`}
          >
            <span className="flex items-center gap-2.5">
              <Icon name={a.icon} className="w-4 h-4" />
              <span className="text-xs font-bold">{a.label}</span>
            </span>
            <Icon name="arrowRight" className="h-3.5 w-3.5 opacity-60" />
          </button>
        ))}
      </div>
    </div>
  );
};
