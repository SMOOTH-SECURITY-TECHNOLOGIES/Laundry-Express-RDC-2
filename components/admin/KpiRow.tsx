import React from 'react';
import { Icon } from '../Icon';

interface KpiData {
  label: string;
  value: string;
  sub?: string;
  change: string;
  changeLabel: string;
  icon: 'currencyDollar' | 'shoppingBag' | 'building' | 'users' | 'truck' | 'lifebuoy' | 'exclamation-circle' | 'shield-check';
  color: string;
  trend: 'up' | 'down';
}

const kpis: KpiData[] = [
  { label: 'Revenue total', value: '11 000 $', change: '+12%', changeLabel: 'vs hier', icon: 'currencyDollar', color: 'bg-blue-50 text-blue-600', trend: 'up' },
  { label: 'Commandes', value: '1 254', change: '+8%', changeLabel: 'vs hier', icon: 'shoppingBag', color: 'bg-purple-50 text-purple-600', trend: 'up' },
  { label: 'Partenaires', value: '32', change: '+6%', changeLabel: 'vs hier', icon: 'building', color: 'bg-green-50 text-green-600', trend: 'up' },
  { label: 'Utilisateurs', value: '12 584', change: '+15%', changeLabel: 'vs hier', icon: 'users', color: 'bg-orange-50 text-orange-600', trend: 'up' },
  { label: 'Chauffeurs actifs', value: '45', sub: '32 en mission · 13 disponibles', change: '+10%', changeLabel: 'vs hier', icon: 'truck', color: 'bg-cyan-50 text-cyan-600', trend: 'up' },
  { label: 'Tickets support', value: '12', change: '-5%', changeLabel: 'vs hier', icon: 'lifebuoy', color: 'bg-red-50 text-red-600', trend: 'down' },
  { label: 'Litiges ouverts', value: '3', change: '+1', changeLabel: 'vs hier', icon: 'exclamation-circle', color: 'bg-amber-50 text-amber-600', trend: 'up' },
  { label: 'Abonnements actifs', value: '29', change: '+18%', changeLabel: 'vs hier', icon: 'shield-check', color: 'bg-indigo-50 text-indigo-600', trend: 'up' },
];

const MiniSparkline: React.FC<{ trend: 'up' | 'down' }> = ({ trend }) => {
  const upPoints = 'M0 18 L8 12 L16 15 L24 6 L32 2';
  const downPoints = 'M0 6 L8 10 L16 8 L24 16 L32 18';
  const path = trend === 'up' ? upPoints : downPoints;

  return (
    <svg width="32" height="20" viewBox="0 0 32 20" fill="none" className="mt-2">
      <path
        d={path}
        stroke={trend === 'up' ? '#22c55e' : '#ef4444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const KpiCard: React.FC<{ kpi: KpiData }> = ({ kpi }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-full ${kpi.color} flex items-center justify-center`}>
          <Icon name={kpi.icon} className="w-5 h-5" />
        </div>
        <MiniSparkline trend={kpi.trend} />
      </div>
      <div className="mt-3">
        <p className="text-3xl font-extrabold text-gray-900">{kpi.value}</p>
        <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
      </div>
      {kpi.sub && (
        <p className="text-[10px] text-gray-400 mt-1">{kpi.sub}</p>
      )}
      <div className="mt-3 flex items-center gap-1">
        <span className={`text-xs font-bold ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {kpi.change}
        </span>
        <span className="text-xs text-gray-400">{kpi.changeLabel}</span>
      </div>
    </div>
  );
};

export const KpiRow: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.slice(0, 4).map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.slice(4, 8).map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>
    </div>
  );
};
