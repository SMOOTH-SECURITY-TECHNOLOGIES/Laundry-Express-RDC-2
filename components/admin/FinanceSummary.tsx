import React from 'react';
import { Icon } from '../Icon';

const metrics = [
  { label: "Revenus aujourd'hui", value: '1 850 $', change: '+9%', icon: 'currencyDollar' as const, positive: true },
  { label: 'Revenus cette semaine', value: '11 000 $', change: '+12%', icon: 'chartBar' as const, positive: true },
  { label: 'Revenus ce mois', value: '42 750 $', change: '+18%', icon: 'chartBar' as const, positive: true },
  { label: 'Commissions dues', value: '5 240 $', change: '', icon: 'wallet' as const, positive: false },
  { label: 'Remboursements', value: '1 120 $', change: '', icon: 'arrowLeft' as const, positive: false },
];

const notifyAdminAction = (message: string) => {
  window.dispatchEvent(new CustomEvent('admin-action', { detail: message }));
};

export const FinanceSummary: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900">Finance – Aperçu</h3>
        <button type="button" onClick={() => notifyAdminAction('Vue financière détaillée ouverte.')} className="text-sm text-brand-blue hover:underline">Voir tout</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50">
            <Icon name={m.icon} className="w-6 h-6 text-gray-500" />
            <span className="text-xl font-bold text-gray-900">{m.value}</span>
            <span className="text-xs text-gray-500">{m.label}</span>
            {m.change && (
              <span className={`text-xs font-medium ${m.positive ? 'text-green-600' : 'text-red-600'}`}>
                {m.change}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
