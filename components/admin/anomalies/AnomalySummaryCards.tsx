import React from 'react';
import type { AnomalySummary } from '../../../lib/admin/anomalies-types';
import { formatImpactAmount } from '../../../lib/admin/anomalies-formatters';
import { Icon } from '../../Icon';

interface AnomalySummaryCardsProps {
  summary: AnomalySummary;
}

interface KpiCard {
  label: string;
  value: string;
  change: string;
  changeColor: string;
  icon: React.ReactNode;
  iconBg: string;
}

export default function AnomalySummaryCards({ summary }: AnomalySummaryCardsProps) {
  const cards: KpiCard[] = [
    {
      label: 'Total anomalies',
      value: summary.total.toString(),
      change: `↑ ${summary.total} vs hier`,
      changeColor: 'text-red-600',
      icon: <Icon name="exclamation-circle" className="w-5 h-5" />,
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Critiques',
      value: summary.critical.toString(),
      change: `↑ ${summary.critical} vs hier`,
      changeColor: 'text-red-600',
      icon: <Icon name="warning" className="w-5 h-5" />,
      iconBg: 'bg-red-100 text-red-600',
    },
    {
      label: 'Impact financier',
      value: formatImpactAmount(summary.financialImpact),
      change: `↑ ${formatImpactAmount(summary.financialImpact)} vs hier`,
      changeColor: 'text-red-600',
      icon: <Icon name="currencyDollar" className="w-5 h-5" />,
      iconBg: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Commandes impactées',
      value: summary.impactedOrders.toString(),
      change: `↑ ${summary.impactedOrders} vs hier`,
      changeColor: 'text-red-600',
      icon: <Icon name="shoppingBag" className="w-5 h-5" />,
      iconBg: 'bg-orange-100 text-orange-600',
    },
    {
      label: 'Temps moyen résolution',
      value: `${summary.averageResolutionMinutes} min`,
      change: `↓ ${summary.averageResolutionMinutes} min vs hier`,
      changeColor: 'text-green-600',
      icon: <Icon name="clock" className="w-5 h-5" />,
      iconBg: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Investigations ouvertes',
      value: summary.openInvestigations.toString(),
      change: `↑ ${summary.openInvestigations} vs hier`,
      changeColor: 'text-purple-600',
      icon: <Icon name="shield-check" className="w-5 h-5" />,
      iconBg: 'bg-teal-100 text-teal-600',
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {card.label}
            </span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${card.iconBg}`}>
              {card.icon}
            </div>
          </div>
          <span className="text-2xl font-bold text-gray-900">{card.value}</span>
          <span className={`text-xs font-medium ${card.changeColor}`}>{card.change}</span>
        </div>
      ))}
    </div>
  );
}
