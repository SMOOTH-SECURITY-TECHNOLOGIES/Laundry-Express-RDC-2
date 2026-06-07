import React from 'react';
import { Icon } from '../Icon';

const leaks = [
  { label: 'Paiements orphelins', count: '2', icon: 'credit-card' as const, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', accent: 'border-l-red-500' },
  { label: 'Collectes non facturées', count: '3', icon: 'document-text' as const, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', accent: 'border-l-orange-500' },
  { label: 'Remboursements suspects', count: '1', icon: 'warning' as const, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', accent: 'border-l-yellow-500' },
  { label: 'Commissions manquantes', count: '4', icon: 'currencyDollar' as const, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', accent: 'border-l-blue-500' },
];

const notifyAdminAction = (message: string) => {
  window.dispatchEvent(new CustomEvent('admin-action', { detail: message }));
};

export function RevenueLeakage() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Icon name="exclamation-circle" className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Revenue Leakage</h2>
        </div>
        <button
          type="button"
          onClick={() => notifyAdminAction('Audit complet Revenue Leakage ouvert.')}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Voir tout
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {leaks.map((leak) => (
          <button
            type="button"
            onClick={() => notifyAdminAction(`Analyse ouverte : ${leak.label}.`)}
            key={leak.label}
            className={`text-left rounded-xl border ${leak.border} border-l-4 ${leak.accent} p-4 hover:shadow-md transition-shadow cursor-pointer`}
          >
            <span className="flex items-center justify-between">
              <span className={`p-2 rounded-lg ${leak.bg}`}>
                <Icon name={leak.icon} className={`w-5 h-5 ${leak.color}`} />
              </span>
              <span className={`text-2xl font-bold ${leak.color}`}>{leak.count}</span>
            </span>
            <span className="block text-sm font-medium text-gray-700 mt-3">{leak.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
