import { Icon } from '../../Icon';
import type { DispatcherKpis } from '../../../lib/admin/dispatcher-types';

interface DispatcherKpiCardsProps {
  kpis: DispatcherKpis;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const width = 60;
  const height = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DispatcherKpiCards({ kpis }: DispatcherKpiCardsProps) {
  const cards = [
    {
      label: 'Missions ouvertes',
      value: String(kpis.openMissions),
      sub: 'À assigner',
      icon: 'list' as const,
      color: '#3b82f6',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-600',
      sparkline: [18, 20, 21, 22, 23, 24, 24, 24, kpis.openMissions],
    },
    {
      label: 'Missions actives',
      value: String(kpis.activeMissions),
      sub: `${kpis.activePercent}% du flux`,
      icon: 'truck' as const,
      color: '#8b5cf6',
      bgClass: 'bg-violet-100',
      textClass: 'text-violet-600',
      sparkline: [30, 32, 34, 35, 36, 37, 38, 38, kpis.activeMissions],
    },
    {
      label: 'Chauffeurs disponibles',
      value: `${kpis.availableDrivers} / ${kpis.totalDrivers}`,
      sub: 'Réseau actif',
      icon: 'users' as const,
      color: '#22c55e',
      bgClass: 'bg-green-100',
      textClass: 'text-green-600',
      sparkline: [14, 15, 16, 16, 17, 17, 18, 18, kpis.availableDrivers],
    },
    {
      label: 'Gains estimés',
      value: `${kpis.estimatedEarnings.toLocaleString('fr-FR')} $`,
      sub: `${kpis.onTimePercent}% à temps`,
      icon: 'currencyDollar' as const,
      color: '#f97316',
      bgClass: 'bg-orange-100',
      textClass: 'text-orange-600',
      sparkline: [1800, 2000, 2100, 2200, 2300, 2350, 2400, 2420, kpis.estimatedEarnings],
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 transition-transform hover:scale-[1.01]">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-full ${card.bgClass} flex items-center justify-center`}>
              <Icon name={card.icon} className={`w-5 h-5 ${card.textClass}`} />
            </div>
            <MiniSparkline data={card.sparkline} color={card.color} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          <span className="inline-block mt-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-full px-2 py-0.5">
            {card.sub}
          </span>
        </div>
      ))}
    </div>
  );
}
