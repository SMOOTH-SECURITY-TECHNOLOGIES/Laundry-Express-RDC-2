import React from 'react';
import { Icon } from '../Icon';

type DriverStats = {
  completedToday: number;
  totalEstimatedEarnings: number;
  weeklyEarnings: number;
  weeklyMissionCount: number;
  acceptanceRate: number;
  acceptedMissions: number;
  offeredMissions: number;
};

const safeNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatMoney = (value: number) => `${safeNumber(value).toFixed(2)} $`;

interface DriverKpiCardsProps {
  stats: DriverStats;
  rating: number;
  reviewCount: number;
}

export const DriverKpiCards: React.FC<DriverKpiCardsProps> = ({ stats, rating, reviewCount }) => {
  const cards = [
    {
      label: 'Terminées',
      value: String(stats.completedToday),
      sub: "Aujourd'hui",
      icon: 'check' as const,
      tone: 'bg-blue-100 text-brand-blue',
    },
    {
      label: 'Gains totaux',
      value: formatMoney(stats.totalEstimatedEarnings),
      sub: 'Estimés',
      icon: 'currencyDollar' as const,
      tone: 'bg-green-100 text-green-600',
    },
    {
      label: 'Cette semaine',
      value: formatMoney(stats.weeklyEarnings),
      sub: `${stats.weeklyMissionCount} mission${stats.weeklyMissionCount > 1 ? 's' : ''}`,
      icon: 'calendar' as const,
      tone: 'bg-violet-100 text-violet-600',
    },
    {
      label: 'Note',
      value: rating.toFixed(1),
      sub: `${reviewCount} avis`,
      icon: 'star' as const,
      tone: 'bg-orange-100 text-orange-500',
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5" aria-label="Indicateurs chauffeur">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-2xl border border-surface-border-subtle bg-surface-card p-4 shadow-card sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14 ${card.tone}`}>
              <Icon name={card.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-content-muted sm:text-xs">{card.label}</p>
              <p className="mt-0.5 truncate text-xl font-black text-content-primary sm:text-3xl">{card.value}</p>
              <p className="mt-0.5 text-[10px] text-content-muted sm:text-xs">{card.sub}</p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
};

export default DriverKpiCards;
