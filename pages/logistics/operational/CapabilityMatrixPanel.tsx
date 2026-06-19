import React from 'react';
import { logisticsCard } from '../logistics-ui';
import type { OperationalModel } from './useOperationalDashboard';

const STATUS_LABEL: Record<OperationalModel['capabilities'][number]['status'], string> = {
  active: 'Actif',
  partial: 'Partiel',
  connect: 'À connecter',
  unavailable: 'Indisponible',
};

const STATUS_TONE: Record<OperationalModel['capabilities'][number]['status'], string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  connect: 'bg-orange-50 text-orange-700 border-orange-200',
  unavailable: 'bg-slate-100 text-slate-600 border-slate-200',
};

const CONFIDENCE_LABEL: Record<OperationalModel['capabilities'][number]['confidence'], string> = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Faible',
};

export const CapabilityMatrixPanel: React.FC<{
  capabilities: OperationalModel['capabilities'];
}> = ({ capabilities }) => (
  <section className={`${logisticsCard} p-5`}>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-brand-blue">TMS Advanced Capabilities</p>
        <h2 className="mt-1 text-lg font-black text-content-primary">Capability Matrix</h2>
        <p className="mt-1 text-sm text-content-muted">
          État réel des modules avancés, sans surpromettre les capacités non branchées.
        </p>
      </div>
      <span className="w-fit rounded-full bg-surface-muted px-3 py-1 text-xs font-black text-content-muted">
        {capabilities.filter((item) => item.status === 'active').length} actif(s)
      </span>
    </div>

    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {capabilities.map((capability) => (
        <article key={capability.id} className="rounded-2xl border border-surface-border-subtle bg-surface-muted/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 text-sm font-black leading-5 text-content-primary">{capability.label}</h3>
            <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${STATUS_TONE[capability.status]}`}>
              {STATUS_LABEL[capability.status]}
            </span>
          </div>
          <dl className="mt-4 space-y-3 text-xs">
            <div>
              <dt className="font-bold uppercase tracking-wide text-content-muted">Source</dt>
              <dd className="mt-1 font-semibold text-content-primary">{capability.source}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-content-muted">Confiance</dt>
              <dd className="mt-1 font-semibold text-content-primary">{CONFIDENCE_LABEL[capability.confidence]}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-content-muted">Prochaine action</dt>
              <dd className="mt-1 leading-5 text-content-muted">{capability.nextAction}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  </section>
);
