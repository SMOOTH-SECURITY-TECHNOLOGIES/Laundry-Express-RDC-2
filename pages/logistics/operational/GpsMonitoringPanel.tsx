import React from 'react';
import { Icon } from '../../../components/Icon';
import { logisticsCard } from '../logistics-ui';
import type { OperationalModel } from './useOperationalDashboard';

const STATUS_LABEL: Record<OperationalModel['gpsHealth']['status'], string> = {
  active: 'Actif',
  partial: 'Partiel',
  connect: 'À connecter',
};

const STATUS_TONE: Record<OperationalModel['gpsHealth']['status'], string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  connect: 'bg-orange-50 text-orange-700 border-orange-200',
};

const CONFIDENCE_LABEL: Record<OperationalModel['gpsHealth']['confidence'], string> = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Faible',
};

export const GpsMonitoringPanel: React.FC<{
  gpsHealth: OperationalModel['gpsHealth'];
}> = ({ gpsHealth }) => (
  <section className={`${logisticsCard} p-5`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Icon name="mapPin" className="h-5 w-5 text-brand-blue" />
          <h2 className="text-lg font-black text-content-primary">GPS Monitoring</h2>
        </div>
        <p className="mt-1 text-sm text-content-muted">Santé du signal terrain, couverture chauffeur et fallback opérationnel.</p>
      </div>
      <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${STATUS_TONE[gpsHealth.status]}`}>
        {STATUS_LABEL[gpsHealth.status]}
      </span>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ['Signaux live', gpsHealth.livePoints],
        ['Signaux anciens', gpsHealth.stalePoints],
        ['Couverture', `${gpsHealth.coverageRate}%`],
        ['Fallback zones', gpsHealth.fallbackZones],
      ].map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-surface-muted px-4 py-3">
          <p className="text-xs font-bold text-content-muted">{label}</p>
          <p className="mt-2 text-2xl font-black text-content-primary">{value}</p>
        </div>
      ))}
    </div>

    <div className="mt-4 grid gap-3 lg:grid-cols-3">
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Dernier signal</p>
        <p className="mt-1 text-sm font-black text-content-primary">{gpsHealth.lastSignalAgo}</p>
      </div>
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Confiance</p>
        <p className="mt-1 text-sm font-black text-content-primary">{CONFIDENCE_LABEL[gpsHealth.confidence]}</p>
      </div>
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Action recommandée</p>
        <p className="mt-1 text-sm font-semibold text-content-primary">{gpsHealth.recommendation}</p>
      </div>
    </div>
  </section>
);
