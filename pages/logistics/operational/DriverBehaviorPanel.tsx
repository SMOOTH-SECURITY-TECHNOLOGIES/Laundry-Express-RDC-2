import React from 'react';
import { Icon } from '../../../components/Icon';
import { logisticsCard } from '../logistics-ui';
import type { OperationalModel } from './useOperationalDashboard';

const STATUS_LABEL: Record<OperationalModel['driverBehavior']['status'], string> = {
  active: 'Actif',
  partial: 'Partiel',
  connect: 'À connecter',
};

const STATUS_TONE: Record<OperationalModel['driverBehavior']['status'], string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  connect: 'bg-orange-50 text-orange-700 border-orange-200',
};

const CONFIDENCE_LABEL: Record<OperationalModel['driverBehavior']['confidence'], string> = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Faible',
};

export const DriverBehaviorPanel: React.FC<{
  behavior: OperationalModel['driverBehavior'];
}> = ({ behavior }) => (
  <section className={`${logisticsCard} p-5`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Icon name="chartBar" className="h-5 w-5 text-brand-blue" />
          <h2 className="text-lg font-black text-content-primary">Driver Behavior Analytics</h2>
        </div>
        <p className="mt-1 text-sm text-content-muted">Ponctualité, incidents, annulations et score chauffeur sans données artificielles.</p>
      </div>
      <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${STATUS_TONE[behavior.status]}`}>
        {STATUS_LABEL[behavior.status]}
      </span>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ['Score moyen', behavior.scoredDrivers > 0 ? `${behavior.averageScore}%` : '—'],
        ['Chauffeurs scorés', `${behavior.scoredDrivers}/${behavior.totalDrivers}`],
        ['Missions clôturées', behavior.completedMissions],
        ['Incidents', behavior.incidents],
      ].map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-surface-muted px-4 py-3">
          <p className="text-xs font-bold text-content-muted">{label}</p>
          <p className="mt-2 text-2xl font-black text-content-primary">{value}</p>
        </div>
      ))}
    </div>

    <div className="mt-4 grid gap-3 lg:grid-cols-3">
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Ponctualité proxy</p>
        <p className="mt-1 text-sm font-black text-content-primary">{behavior.punctualityRate}%</p>
      </div>
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Annulations</p>
        <p className="mt-1 text-sm font-black text-content-primary">{behavior.cancellations}</p>
      </div>
      <div className="rounded-2xl border border-surface-border-subtle px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Confiance</p>
        <p className="mt-1 text-sm font-black text-content-primary">{CONFIDENCE_LABEL[behavior.confidence]}</p>
      </div>
    </div>

    <div className="mt-4 rounded-2xl border border-surface-border-subtle bg-surface-muted/40 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Action recommandée</p>
      <p className="mt-1 text-sm font-semibold text-content-primary">{behavior.recommendation}</p>
    </div>
  </section>
);
