import React from 'react';
import { Icon } from '../Icon';

const metrics = [
  { label: "Revenu aujourd'hui", value: '1 850 $', change: '+9%', icon: 'currencyDollar' as const, positive: true },
  { label: 'Revenu semaine', value: '11 000 $', change: '+12%', icon: 'chartBar' as const, positive: true },
  { label: 'Revenu mois', value: '42 750 $', change: '+18%', icon: 'chartBar' as const, positive: true },
  { label: 'Commissions dues', value: '5 240 $', change: 'à payer', icon: 'wallet' as const, positive: false },
  { label: 'Commissions payées', value: '18 900 $', change: 'ce mois', icon: 'shield-check' as const, positive: true },
  { label: 'Cash en transit', value: '2 460 $', change: 'chauffeurs', icon: 'truck' as const, positive: false },
];

const chartPoints = [18, 28, 24, 38, 44, 39, 52, 48, 61, 57, 68, 72];

const notifyAdminAction = (message: string) => {
  window.dispatchEvent(new CustomEvent('admin-action', { detail: message }));
};

export const FinanceSummary: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-gray-900">Finance – Aperçu</h3>
          <p className="text-xs text-gray-500">Revenus, commissions et cash opérationnel.</p>
        </div>
        <button type="button" onClick={() => notifyAdminAction('Vue financière détaillée ouverte.')} className="text-sm text-brand-blue hover:underline">Voir tout</button>
      </div>
      <div className="mb-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Tendance revenus</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">+18.4%</p>
          </div>
          <svg viewBox="0 0 220 70" className="h-16 w-48 max-w-full" aria-hidden="true">
            <path d="M0 60 H220" stroke="#dbeafe" strokeWidth="1" />
            <path
              d={chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${index * 20} ${70 - point}`).join(' ')}
              fill="none"
              stroke="#0B5FFF"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {chartPoints.map((point, index) => (
              <circle key={index} cx={index * 20} cy={70 - point} r="2.5" fill="#0B5FFF" />
            ))}
          </svg>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50">
            <Icon name={m.icon} className={`w-6 h-6 ${m.positive ? 'text-green-600' : 'text-orange-600'}`} />
            <span className="text-xl font-bold text-gray-900">{m.value}</span>
            <span className="text-xs text-gray-500">{m.label}</span>
            <span className={`text-xs font-medium ${m.positive ? 'text-green-600' : 'text-orange-600'}`}>
              {m.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
