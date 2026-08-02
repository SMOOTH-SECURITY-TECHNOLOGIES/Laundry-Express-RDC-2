import React from 'react';
import { Icon } from '../../../components/Icon';
import { logisticsCard } from '../logistics-ui';
import type { NavigateHandler, OperationalModel } from './useOperationalDashboard';

const STATUS_LABEL: Record<OperationalModel['fuelControl']['status'], string> = {
  partial: 'Partiel',
  connect: 'À connecter',
};

const STATUS_TONE: Record<OperationalModel['fuelControl']['status'], string> = {
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  connect: 'bg-orange-50 text-orange-700 border-orange-200',
};

const CONFIDENCE_LABEL: Record<OperationalModel['fuelControl']['confidence'], string> = {
  medium: 'Moyenne',
  low: 'Faible',
};

export const FuelControlPanel: React.FC<{
  fuel: OperationalModel['fuelControl'];
  onNavigate?: NavigateHandler;
}> = ({ fuel, onNavigate }) => (
  <section className={`${logisticsCard} p-5`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Icon name="currencyDollar" className="h-5 w-5 text-brand-blue" />
          <h2 className="text-lg font-black text-content-primary">Fuel Control</h2>
        </div>
        <p className="mt-1 text-sm text-content-muted">Coût carburant estimé par missions et véhicules, en attente du contrat fuel réel.</p>
      </div>
      <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${STATUS_TONE[fuel.status]}`}>
        {STATUS_LABEL[fuel.status]}
      </span>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ['Km estimés', `${fuel.estimatedKm} km`],
        ['Coût estimé', `${fuel.estimatedCost} $`],
        ['Coût / mission', `${fuel.costPerMission} $`],
        ['Coût / km', `${fuel.costPerKm} $`],
      ].map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-surface-muted px-4 py-3">
          <p className="text-xs font-bold text-content-muted">{label}</p>
          <p className="mt-2 text-2xl font-black text-content-primary">{value}</p>
        </div>
      ))}
    </div>

    <div className="mt-4 grid gap-3 lg:grid-cols-3">
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Véhicules suivis</p>
        <p className="mt-1 text-sm font-black text-content-primary">{fuel.trackedVehicles}</p>
      </div>
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Anomalies proxy</p>
        <p className="mt-1 text-sm font-black text-content-primary">{fuel.anomalyCount}</p>
      </div>
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Confiance</p>
        <p className="mt-1 text-sm font-black text-content-primary">{CONFIDENCE_LABEL[fuel.confidence]}</p>
      </div>
    </div>

    <button
      type="button"
      onClick={() => onNavigate?.(fuel.anomalyCount > 0 ? 'maintenance' : 'reports')}
      className="mt-4 w-full rounded-2xl border border-surface-border-subtle bg-surface-muted/40 px-4 py-3 text-left text-sm font-semibold text-content-primary hover:bg-brand-blue/10"
    >
      <span className="block text-xs font-bold uppercase tracking-wide text-content-muted">Action recommandée</span>
      <span className="mt-1 block">{fuel.recommendation}</span>
    </button>
  </section>
);
