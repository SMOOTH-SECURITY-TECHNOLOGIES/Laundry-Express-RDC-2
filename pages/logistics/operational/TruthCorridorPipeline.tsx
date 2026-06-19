import React from 'react';
import { logisticsCard } from '../logistics-ui';
import type { OperationalModel } from './useOperationalDashboard';

export const TruthCorridorPipeline: React.FC<{ model: OperationalModel }> = ({ model }) => {
  const periodQuiet = model.corridorPipeline.every((step) => (step.value ?? 0) === 0);

  return (
    <section className={`${logisticsCard} p-5`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-content-primary">Corridor de vérité</h2>
          <p className="mt-1 text-sm text-content-muted">{model.networkPulse}</p>
        </div>
        <div className="rounded-2xl bg-brand-blue/10 px-4 py-2 text-right">
          <p className="text-xs font-bold text-content-muted">Conversion corridor</p>
          <p className="text-2xl font-black text-brand-blue">
            {model.completionRate > 0 ? `${model.completionRate}%` : '—'}
          </p>
          {model.completionRate === 0 && (
            <p className="text-[10px] font-semibold text-content-muted">En attente de flux</p>
          )}
        </div>
      </div>

      {periodQuiet && (
        <p className="mt-4 rounded-xl border border-surface-border-subtle bg-surface-muted/60 px-4 py-2.5 text-sm font-semibold text-content-primary">
          Période calme — le réseau reste actif. Consultez les dernières activités ci-dessous.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {model.corridorPipeline.map((step, index) => {
          const isEmpty = step.value === null || step.value === 0;
          return (
            <React.Fragment key={step.label}>
              <div className="rounded-2xl border border-surface-border-subtle bg-surface-muted/40 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-content-muted">{step.label}</p>
                <p className={`mt-1 font-black text-content-primary ${isEmpty ? 'text-xl' : 'text-3xl'}`}>
                  {step.value === null ? '—' : isEmpty ? '·' : step.value}
                </p>
                <p className={`mt-1.5 leading-snug ${isEmpty ? 'text-sm font-semibold text-content-primary' : 'text-xs font-medium text-content-muted'}`}>
                  {step.context}
                </p>
              </div>
              {index < model.corridorPipeline.length - 1 && (
                <div className="hidden items-center justify-center text-xl font-black text-content-muted lg:flex">↓</div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {model.completionRate > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex justify-between text-sm font-black text-content-primary">
            <span>Taux de conversion global</span>
            <span>{model.completionRate}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-brand-blue" style={{ width: `${Math.min(100, model.completionRate)}%` }} />
          </div>
        </div>
      )}
    </section>
  );
};
