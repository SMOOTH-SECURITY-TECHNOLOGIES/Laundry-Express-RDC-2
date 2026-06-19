import React from 'react';
import { Icon } from '../../../components/Icon';
import { logisticsCard } from '../logistics-ui';
import type { NavigateHandler, OperationalModel } from './useOperationalDashboard';

const STATUS_LABEL: Record<OperationalModel['vehicleHealth']['status'], string> = {
  active: 'Actif',
  partial: 'Partiel',
  connect: 'À connecter',
};

const STATUS_TONE: Record<OperationalModel['vehicleHealth']['status'], string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  partial: 'bg-orange-50 text-orange-700 border-orange-200',
  connect: 'bg-slate-50 text-slate-600 border-slate-200',
};

const CONFIDENCE_LABEL: Record<OperationalModel['vehicleHealth']['confidence'], string> = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Faible',
};

export const VehicleHealthPanel: React.FC<{
  health: OperationalModel['vehicleHealth'];
  onNavigate?: NavigateHandler;
}> = ({ health, onNavigate }) => (
  <section className={`${logisticsCard} p-5`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Icon name="truck" className="h-5 w-5 text-brand-blue" />
          <h2 className="text-lg font-black text-content-primary">Vehicle Health</h2>
        </div>
        <p className="mt-1 text-sm text-content-muted">Disponibilité flotte, assurance, entretien et blocage d’assignation.</p>
      </div>
      <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${STATUS_TONE[health.status]}`}>
        {STATUS_LABEL[health.status]}
      </span>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ['Assignables', `${health.assignableVehicles}/${health.totalVehicles}`],
        ['Bloqués', health.blockedVehicles],
        ['Overdue', health.overdueMaintenance],
        ['Prêts', `${health.readinessRate}%`],
      ].map(([label, value]) => (
        <button
          key={label}
          type="button"
          onClick={() => onNavigate?.(label === 'Assignables' ? 'fleet' : 'maintenance')}
          className="rounded-2xl bg-surface-muted px-4 py-3 text-left hover:bg-brand-blue/10"
        >
          <p className="text-xs font-bold text-content-muted">{label}</p>
          <p className="mt-2 text-2xl font-black text-content-primary">{value}</p>
        </button>
      ))}
    </div>

    <div className="mt-4 grid gap-3 lg:grid-cols-3">
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Assurance proche</p>
        <p className="mt-1 text-sm font-black text-content-primary">{health.insuranceExpiring}</p>
      </div>
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Service bientôt dû</p>
        <p className="mt-1 text-sm font-black text-content-primary">{health.serviceDueSoon}</p>
      </div>
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Confiance</p>
        <p className="mt-1 text-sm font-black text-content-primary">{CONFIDENCE_LABEL[health.confidence]}</p>
      </div>
    </div>

    <button
      type="button"
      onClick={() => onNavigate?.(health.blockedVehicles > 0 || health.overdueMaintenance > 0 ? 'maintenance' : 'fleet')}
      className="mt-4 w-full rounded-2xl border border-surface-border-subtle bg-surface-muted/40 px-4 py-3 text-left text-sm font-semibold text-content-primary hover:bg-brand-blue/10"
    >
      <span className="block text-xs font-bold uppercase tracking-wide text-content-muted">Action recommandée</span>
      <span className="mt-1 block">{health.recommendation}</span>
    </button>
  </section>
);
