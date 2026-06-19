import React from 'react';
import { logisticsCard } from '../logistics-ui';
import type { BackendActivityLogDashboardResponse } from '../../../services/real-api';
import type { OperationalModel } from './useOperationalDashboard';

export const ActivityFeedPanel: React.FC<{
  events: BackendActivityLogDashboardResponse['events'];
  signals: OperationalModel['activitySignals'];
}> = ({ events, signals }) => (
  <section className={`${logisticsCard} p-4`}>
    <h3 className="font-black text-content-primary">Activity feed temps réel</h3>

    {events.length > 0 ? (
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {events.slice(0, 20).map((event) => {
          const reference = event.reference || event.resource_id || event.event_id || 'Référence non fournie';
          return (
            <div key={event.id} className="rounded-xl bg-surface-muted p-3 text-sm">
              <p className="font-black text-content-primary">{event.action_label || event.action}</p>
              <p className="text-xs text-content-muted">
                {reference} ·{' '}
                {event.occurred_at ? new Date(event.occurred_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--'}
              </p>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="mt-3 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Dernières activités connues</p>
        {signals.length === 0 ? (
          <p className="rounded-xl bg-surface-muted px-4 py-3 text-sm text-content-muted">
            Réseau connecté — en attente des premiers événements terrain.
          </p>
        ) : (
          signals.map((signal) => (
            <div key={`${signal.label}-${signal.detail}`} className="flex items-start justify-between gap-3 rounded-xl bg-surface-muted px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-content-primary">{signal.label}</p>
                <p className="truncate text-xs text-content-muted">{signal.detail}</p>
              </div>
              <span className="shrink-0 text-xs font-bold text-brand-blue">{signal.ago}</span>
            </div>
          ))
        )}
      </div>
    )}
  </section>
);
