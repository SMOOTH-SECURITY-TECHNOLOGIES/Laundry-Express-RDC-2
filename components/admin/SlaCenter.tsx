import React from 'react';
import { Icon } from '../Icon';

const cards = [
  { label: 'Dans SLA', value: '94%', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500', pct: 94 },
  { label: 'À risque', value: '12', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-500', pct: 5 },
  { label: 'Dépassés', value: '3', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-500', pct: 1 },
];

const notifyAdminAction = (message: string) => {
  window.dispatchEvent(new CustomEvent('admin-action', { detail: message }));
};

export function SlaCenter() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Icon name="clock" className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">SLA Center</h2>
        </div>
        <button
          type="button"
          onClick={() => notifyAdminAction('SLA Center détaillé ouvert.')}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Voir tout
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.bg} ${card.border}`}>
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
              <div className={`${card.bar} h-1.5 rounded-full`} style={{ width: `${card.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Stacked Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Répartition SLA</span>
          <span>100%</span>
        </div>
        <div className="w-full h-4 rounded-full overflow-hidden flex">
          <div className="bg-green-500 h-full" style={{ width: '94%' }} />
          <div className="bg-orange-500 h-full" style={{ width: '5%' }} />
          <div className="bg-red-500 h-full" style={{ width: '1%' }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            <span>94% à temps</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
            <span>5% risque</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span>1% dépassé</span>
          </div>
        </div>
      </div>
    </div>
  );
}
