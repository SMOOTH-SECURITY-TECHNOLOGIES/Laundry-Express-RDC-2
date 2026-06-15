import React from 'react';
import { Icon } from '../../Icon';
import type { AdminServiceSummary } from '../../../lib/admin/services-types';
import { formatCurrency, formatNumber, formatPercent } from '../../../lib/admin/services-formatters';

interface ServiceKpiCardsProps {
  summary: AdminServiceSummary;
}

interface KpiCard {
  label: string;
  value: string;
  change: string;
  icon: 'sparkles' | 'currencyDollar' | 'shoppingBag' | 'shield-check' | 'star' | 'badge-check';
  color: string;
  bgColor: string;
  sparkline: number[];
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-40">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ServiceKpiCards({ summary }: ServiceKpiCardsProps) {
  const cards: KpiCard[] = [
    {
      label: 'Services actifs',
      value: formatNumber(summary.activeServices),
      change: '+12% vs mois dernier',
      icon: 'sparkles',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      sparkline: [12, 14, 13, 16, 15, 18, 17, 18],
    },
    {
      label: 'Revenu mensuel',
      value: formatCurrency(summary.monthlyRevenue),
      change: '+16%',
      icon: 'currencyDollar',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      sparkline: [65, 70, 68, 75, 78, 80, 82, 85],
    },
    {
      label: 'Commandes',
      value: formatNumber(summary.totalOrders),
      change: '+14%',
      icon: 'shoppingBag',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      sparkline: [9800, 10200, 10800, 11200, 11800, 12000, 12200, 12458],
    },
    {
      label: 'SLA moyen',
      value: formatPercent(summary.averageSla),
      change: '+3%',
      icon: 'shield-check',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      sparkline: [88, 89, 90, 91, 92, 93, 93, 94],
    },
    {
      label: 'Satisfaction',
      value: `${summary.averageRating} / 5`,
      change: '+6%',
      icon: 'star',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      sparkline: [4.2, 4.3, 4.4, 4.5, 4.6, 4.6, 4.7, 4.8],
    },
    {
      label: 'Truth Score',
      value: `${summary.globalTruthScore} / 100`,
      change: '+5 pts',
      icon: 'badge-check',
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      sparkline: [85, 87, 89, 90, 92, 94, 96, 97],
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-full ${card.bgColor} flex items-center justify-center`}>
              <Icon name={card.icon} className={`w-5 h-5 ${card.color}`} />
            </div>
            <MiniSparkline data={card.sparkline} color={card.color.replace('text-', '')} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            <span className="inline-block mt-2 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/40 rounded-full px-2 py-0.5">
              {card.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
