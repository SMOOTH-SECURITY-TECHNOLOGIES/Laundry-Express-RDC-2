import React from 'react';
import { Icon } from '../../../components/Icon';
import { logisticsCard } from '../logistics-ui';
import type { NavigateHandler, OperationalModel } from './useOperationalDashboard';

const STATUS_LABEL: Record<OperationalModel['connectivity']['status'], string> = {
  partial: 'Partiel',
  connect: 'À connecter',
};

const STATUS_TONE: Record<OperationalModel['connectivity']['status'], string> = {
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  connect: 'bg-orange-50 text-orange-700 border-orange-200',
};

const CONFIDENCE_LABEL: Record<OperationalModel['connectivity']['confidence'], string> = {
  medium: 'Moyenne',
  low: 'Faible',
};

export const ConnectivityPanel: React.FC<{
  connectivity: OperationalModel['connectivity'];
  onNavigate?: NavigateHandler;
}> = ({ connectivity, onNavigate }) => (
  <section className={`${logisticsCard} p-5`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Icon name="device-phone-mobile" className="h-5 w-5 text-brand-blue" />
          <h2 className="text-lg font-black text-content-primary">Connectivity</h2>
        </div>
        <p className="mt-1 text-sm text-content-muted">Santé app chauffeur, dernier ping, signaux anciens et synchronisation terrain.</p>
      </div>
      <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${STATUS_TONE[connectivity.status]}`}>
        {STATUS_LABEL[connectivity.status]}
      </span>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ['Couverture', `${connectivity.coverageRate}%`],
        ['Ping récent', `${connectivity.driversWithRecentSignal}/${connectivity.activeDrivers}`],
        ['Sans signal', connectivity.driversWithoutSignal],
        ['Sync pending', connectivity.syncPending],
      ].map(([label, value]) => (
        <button
          key={label}
          type="button"
          onClick={() => onNavigate?.(label === 'Sans signal' || label === 'Sync pending' ? 'drivers' : 'tracking')}
          className="rounded-2xl bg-surface-muted px-4 py-3 text-left hover:bg-brand-blue/10"
        >
          <p className="text-xs font-bold text-content-muted">{label}</p>
          <p className="mt-2 text-2xl font-black text-content-primary">{value}</p>
        </button>
      ))}
    </div>

    <div className="mt-4 grid gap-3 lg:grid-cols-3">
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Dernier ping</p>
        <p className="mt-1 text-sm font-black text-content-primary">{connectivity.lastPingAgo}</p>
      </div>
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Signaux anciens</p>
        <p className="mt-1 text-sm font-black text-content-primary">{connectivity.staleSignals}</p>
      </div>
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Confiance</p>
        <p className="mt-1 text-sm font-black text-content-primary">{CONFIDENCE_LABEL[connectivity.confidence]}</p>
      </div>
    </div>

    <button
      type="button"
      onClick={() => onNavigate?.(connectivity.syncPending > 0 ? 'drivers' : 'tracking')}
      className="mt-4 w-full rounded-2xl border border-surface-border-subtle bg-surface-muted/40 px-4 py-3 text-left text-sm font-semibold text-content-primary hover:bg-brand-blue/10"
    >
      <span className="block text-xs font-bold uppercase tracking-wide text-content-muted">Action recommandée</span>
      <span className="mt-1 block">{connectivity.recommendation}</span>
    </button>
  </section>
);
