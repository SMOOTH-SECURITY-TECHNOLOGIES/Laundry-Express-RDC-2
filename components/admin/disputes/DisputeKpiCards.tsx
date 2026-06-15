import React from 'react';
import type { DisputeSummary } from '../../../lib/admin/disputes-types';
import { Icon } from '../../Icon';

interface DisputeKpiCardsProps {
  summary: DisputeSummary;
}

interface KpiCard {
  label: string;
  value: string;
  change: string;
  changeColor: string;
  icon: React.ReactNode;
  iconBg: string;
  sparkline: number[];
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} className="opacity-40">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

export function DisputeKpiCards({ summary }: DisputeKpiCardsProps) {
  const cards: KpiCard[] = [
    {
      label: 'Demandes totales',
      value: summary.totalRequests.toString(),
      change: '+18%',
      changeColor: 'text-green-600',
      icon: <Icon name="document-text" className="w-5 h-5" />,
      iconBg: 'bg-blue-100 text-blue-600',
      sparkline: [10, 12, 11, 14, 13, 15, 14],
    },
    {
      label: 'En attente',
      value: summary.pending.toString(),
      change: '+8%',
      changeColor: 'text-yellow-600',
      icon: <Icon name="clock" className="w-5 h-5" />,
      iconBg: 'bg-yellow-100 text-yellow-600',
      sparkline: [5, 6, 7, 6, 8, 7, 9],
    },
    {
      label: 'En cours d\'examen',
      value: summary.underReview.toString(),
      change: '-5%',
      changeColor: 'text-red-600',
      icon: <Icon name="arrow-path" className="w-5 h-5" />,
      iconBg: 'bg-indigo-100 text-indigo-600',
      sparkline: [3, 4, 3, 5, 4, 6, 5],
    },
    {
      label: 'Approuvées',
      value: summary.approved.toString(),
      change: '+22%',
      changeColor: 'text-green-600',
      icon: <Icon name="check" className="w-5 h-5" />,
      iconBg: 'bg-green-100 text-green-600',
      sparkline: [8, 10, 12, 14, 16, 18, 20],
    },
    {
      label: 'Rejetées',
      value: summary.rejected.toString(),
      change: '+5%',
      changeColor: 'text-red-600',
      icon: <Icon name="xmark" className="w-5 h-5" />,
      iconBg: 'bg-red-100 text-red-600',
      sparkline: [4, 3, 5, 4, 6, 5, 7],
    },
    {
      label: 'Montant total demandé',
      value: `${summary.totalRequestedAmount.toLocaleString('fr-FR')} $`,
      change: '+15%',
      changeColor: 'text-amber-600',
      icon: <Icon name="currencyDollar" className="w-5 h-5" />,
      iconBg: 'bg-amber-100 text-amber-600',
      sparkline: [1200, 1500, 1800, 2100, 2400, 2600, 2845],
    },
    {
      label: 'Montant remboursé',
      value: `${summary.totalRefundedAmount.toLocaleString('fr-FR')} $`,
      change: '+20%',
      changeColor: 'text-green-600',
      icon: <Icon name="wallet" className="w-5 h-5" />,
      iconBg: 'bg-teal-100 text-teal-600',
      sparkline: [800, 1000, 1200, 1400, 1500, 1650, 1738],
    },
    {
      label: 'Taux acceptation',
      value: `${summary.acceptanceRate}%`,
      change: '+8%',
      changeColor: 'text-green-600',
      icon: <Icon name="shield-check" className="w-5 h-5" />,
      iconBg: 'bg-emerald-100 text-emerald-600',
      sparkline: [65, 68, 70, 72, 74, 76, 78],
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2"
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
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${card.changeColor}`}>{card.change}</span>
            <MiniSparkline data={card.sparkline} color={card.changeColor.includes('green') ? '#16a34a' : '#2563eb'} />
          </div>
        </div>
      ))}
    </div>
  );
}
