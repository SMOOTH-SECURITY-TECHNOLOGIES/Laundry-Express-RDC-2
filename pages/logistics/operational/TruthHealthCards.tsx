import React from 'react';
import { logisticsCard } from '../logistics-ui';
import type { OperationalModel } from './useOperationalDashboard';

const HealthCard: React.FC<{ item: OperationalModel['health'][number] }> = ({ item }) => (
  <div className="min-w-[140px] rounded-2xl border border-surface-border-subtle bg-surface-muted/30 p-3">
    <p className="whitespace-nowrap text-sm font-black text-content-primary">{item.label}</p>
    <p className="mt-1.5 text-xs font-semibold leading-relaxed text-content-primary">{item.detail}</p>
    <p
      className={`mt-2 text-[11px] font-black uppercase tracking-wide ${
        item.status === 'SAIN' ? 'text-green-600' : item.status === 'DEGRADE' ? 'text-red-600' : 'text-orange-600'
      }`}
    >
      {item.status}
    </p>
  </div>
);

export const TruthHealthCards: React.FC<{ model: OperationalModel }> = ({ model }) => {
  const primary = model.health.slice(0, 4);
  const secondary = model.health.slice(4);

  return (
    <section className={`${logisticsCard} p-4`}>
      <h3 className="font-black text-content-primary">État des corridors</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {primary.map((item) => (
          <HealthCard key={item.label} item={item} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {secondary.map((item) => (
          <HealthCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
};
