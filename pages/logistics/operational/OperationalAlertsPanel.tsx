import React from 'react';
import type { OperationalAlerts, OperationalModel, NavigateHandler } from './useOperationalDashboard';

export const OperationalAlertsPanel: React.FC<{
  alerts: OperationalAlerts;
  exceptions?: OperationalModel['operationalExceptions'];
  onNavigate?: NavigateHandler;
  variant?: 'tower' | 'card';
}> = ({ alerts, exceptions = [], onNavigate, variant = 'card' }) => {
  const needsAction = alerts.some((alert) => alert.severity === 'high' || alert.type === 'retard');
  const empty = !needsAction && alerts.length === 0 && exceptions.length === 0;
  const severityClass = (severity: OperationalModel['operationalExceptions'][number]['severity']) =>
    severity === 'critical' ? 'bg-red-400' : severity === 'warning' ? 'bg-orange-400' : 'bg-blue-400';

  if (variant === 'tower') {
    return (
      <article className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
        <h2 className="text-lg font-black">Alertes opérationnelles</h2>
        <div className="mt-4 space-y-3">
          {empty ? (
            <p className="text-sm text-white/55">Aucune action requise pour le moment.</p>
          ) : (
            <>
              {exceptions.slice(0, 5).map((exception) => (
                <button
                  key={exception.id}
                  type="button"
                  onClick={() =>
                    onNavigate?.(exception.target, {
                      missionId: exception.missionId,
                      zone: exception.zone,
                    })
                  }
                  className="grid w-full grid-cols-[10px_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl bg-black/20 p-3 text-left hover:bg-white/10"
                >
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${severityClass(exception.severity)}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">{exception.type}</span>
                    <span className="mt-1 block truncate text-xs text-white/50">
                      {exception.reference} · {exception.commune}
                    </span>
                  </span>
                  <span className="max-w-[90px] truncate rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-white/70">
                    {exception.impact}
                  </span>
                </button>
              ))}
              {alerts.slice(0, Math.max(0, 5 - exceptions.length)).map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => onNavigate?.('alerts')}
                  className="w-full rounded-2xl bg-black/20 p-3 text-left hover:bg-white/10"
                >
                  <p className="text-sm font-black">{alert.title}</p>
                  <p className="mt-1 text-xs text-white/50">{alert.description}</p>
                </button>
              ))}
            </>
          )}
        </div>
      </article>
    );
  }

  return null;
};
