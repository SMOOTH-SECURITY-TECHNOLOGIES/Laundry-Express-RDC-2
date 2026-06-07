import React from 'react';
import { Icon } from '../Icon';

const stats = [
  { label: 'Commandes tracées', value: '98.2%', color: 'bg-green-50 text-green-600', icon: 'shield-check' as const },
  { label: 'Anomalies détectées', value: '18', color: 'bg-orange-50 text-orange-600', icon: 'exclamation-circle' as const },
  { label: 'Investigations ouvertes', value: '5', color: 'bg-blue-50 text-blue-600', icon: 'magnifying-glass-plus' as const },
  { label: 'Résolution moyenne', value: '7 min', color: 'bg-green-50 text-green-600', icon: 'clock-history' as const },
];

const steps = [
  { label: 'Créée', time: '10:12', status: 'done' as const },
  { label: 'Payée', time: '10:14', status: 'done' as const },
  { label: 'Collectée', time: '10:16', status: 'done' as const },
  { label: 'Traitée', time: '10:18', status: 'done' as const },
  { label: 'Livraison', time: '10:22', status: 'current' as const },
  { label: 'Livrée', time: '', status: 'pending' as const },
];

const stepColors: Record<string, { ring: string; bg: string; text: string; line: string }> = {
  done: { ring: 'border-green-500', bg: 'bg-green-500', text: 'text-green-600', line: 'bg-green-500' },
  current: { ring: 'border-blue-500', bg: 'bg-blue-500', text: 'text-blue-600', line: 'bg-gray-200' },
  pending: { ring: 'border-gray-300', bg: 'bg-gray-300', text: 'text-gray-400', line: 'bg-gray-200' },
};

export const TruthDashboard: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center`}>
                <Icon name={s.icon} className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-900">Order Truth récent</h3>
          <span className="text-xs text-gray-400 bg-gray-50 rounded-full px-2.5 py-0.5">ORD-001</span>
        </div>

        <div className="flex items-center justify-between px-4">
          {steps.map((step, i) => {
            const colors = stepColors[step.status];
            const isLast = i === steps.length - 1;
            const checkmark = step.status === 'done' || step.status === 'current';
            return (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center relative">
                  <div
                    className={`w-9 h-9 rounded-full border-2 ${colors.ring} flex items-center justify-center ${
                      step.status === 'done' || step.status === 'current' ? colors.bg : 'bg-white'
                    }`}
                  >
                    {step.status === 'done' ? (
                      <Icon name="check" className="w-4 h-4 text-white" />
                    ) : step.status === 'current' ? (
                      <Icon name="check" className="w-4 h-4 text-white" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-gray-300" />
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${step.status === 'pending' ? colors.text : 'text-gray-700'}`}>
                    {step.label}
                  </span>
                  {step.time && (
                    <span className="text-[10px] text-gray-400 mt-0.5">{step.time}</span>
                  )}
                </div>
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2 rounded-full bg-gray-200 relative -mt-6">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        step.status === 'done' ? 'bg-green-500 w-full' : 'bg-gray-200 w-0'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
