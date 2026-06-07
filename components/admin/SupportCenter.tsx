import React from 'react';

const supportMetrics = [
  { label: 'Tickets ouverts', value: '12' },
  { label: 'Critiques', value: '5' },
  { label: 'Temps moyen réponse', value: '42 min' },
  { label: 'Satisfaction', value: '92%' },
];

const ticketDistribution = [
  { label: 'En cours', value: 5, color: '#3b82f6' },
  { label: 'En attente', value: 4, color: '#eab308' },
  { label: 'Résolus', value: 3, color: '#22c55e' },
];

const total = ticketDistribution.reduce((s, t) => s + t.value, 0);

const notifyAdminAction = (message: string) => {
  window.dispatchEvent(new CustomEvent('admin-action', { detail: message }));
};

export const SupportCenter: React.FC = () => {
  const radius = 40;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Support Center</h3>
        <button type="button" onClick={() => notifyAdminAction('Support Center détaillé ouvert.')} className="text-sm text-brand-blue hover:underline">Voir tout</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid grid-cols-2 gap-3">
          {supportMetrics.map((m) => (
            <div key={m.label} className="flex flex-col gap-1 p-4 rounded-xl bg-gray-50">
              <span className="text-2xl font-bold text-gray-900">{m.value}</span>
              <span className="text-xs text-gray-500">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-4">
          <svg width="120" height="120" viewBox="0 0 100 100">
            {ticketDistribution.map((segment) => {
              const offset = circumference - (cumulative / total) * circumference;
              const dash = (segment.value / total) * circumference;
              cumulative += segment.value;
              return (
                <circle
                  key={segment.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <div className="flex flex-wrap justify-center gap-3">
            {ticketDistribution.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label} ({s.value})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
