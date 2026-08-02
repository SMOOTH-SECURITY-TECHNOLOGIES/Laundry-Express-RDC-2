import React from 'react';
import type { OperationalModel, SourceSyncStatus } from './useOperationalDashboard';

export const OperationalNetworkStrip: React.FC<{
  model: OperationalModel;
  syncStatus: SourceSyncStatus;
}> = ({ model, syncStatus }) => (
  <section className="grid gap-3 lg:grid-cols-3">
    <article className="rounded-[20px] border border-green-200 bg-green-50 p-4">
      <p className="text-[11px] font-black uppercase tracking-wide text-green-800">Synchronisation</p>
      <p className="mt-1 text-sm font-semibold text-green-900">{syncStatus.label}</p>
      <p className="mt-1 text-xs text-green-800/80">{model.networkPulse}</p>
    </article>

    <article
      className={`rounded-[20px] border p-4 ${
        model.capacitySummary.sufficient
          ? 'border-blue-200 bg-blue-50'
          : model.capacitySummary.available === 0
            ? 'border-red-200 bg-red-50'
            : 'border-orange-200 bg-orange-50'
      }`}
    >
      <p
        className={`text-[11px] font-black uppercase tracking-wide ${
          model.capacitySummary.sufficient
            ? 'text-blue-800'
            : model.capacitySummary.available === 0
              ? 'text-red-800'
              : 'text-orange-800'
        }`}
      >
        Capacité réseau
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${
          model.capacitySummary.sufficient
            ? 'text-blue-900'
            : model.capacitySummary.available === 0
              ? 'text-red-900'
              : 'text-orange-900'
        }`}
      >
        {model.capacitySummary.headline}
      </p>
      <p className="mt-1 text-xs text-content-muted">{model.capacitySummary.detail}</p>
    </article>

    <article
      className={`rounded-[20px] border p-4 ${
        model.fleet.total === 0
          ? 'border-slate-200 bg-slate-50'
          : model.fleet.blockingMaintenance > 0 || model.fleet.outOfService > 0
            ? 'border-orange-200 bg-orange-50'
            : 'border-green-200 bg-green-50'
      }`}
    >
      <p
        className={`text-[11px] font-black uppercase tracking-wide ${
          model.fleet.total === 0
            ? 'text-slate-700'
            : model.fleet.blockingMaintenance > 0 || model.fleet.outOfService > 0
              ? 'text-orange-800'
              : 'text-green-800'
        }`}
      >
        État flotte
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${
          model.fleet.total === 0
            ? 'text-slate-900'
            : model.fleet.blockingMaintenance > 0 || model.fleet.outOfService > 0
              ? 'text-orange-900'
              : 'text-green-900'
        }`}
      >
        {model.fleet.total === 0
          ? 'Aucun véhicule synchronisé'
          : `${model.fleet.readinessRate}% prêt · ${model.fleet.available} disponible(s)`}
      </p>
      <p className="mt-1 text-xs text-content-muted">
        {model.fleet.inMission} en mission · {model.fleet.maintenance} maintenance · {model.fleet.outOfService} hors service
      </p>
    </article>
  </section>
);
