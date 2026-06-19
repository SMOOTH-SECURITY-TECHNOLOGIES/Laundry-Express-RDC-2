import React from 'react';
import type { OperationalDecision } from './operational-decisions';
import type { CapacitySummary } from './operational-decisions';
import type { NavigateHandler } from './useOperationalDashboard';

const PRIORITY_LABEL: Record<OperationalDecision['priority'], string> = {
  critical: 'CRITIQUE',
  high: 'URGENT',
  medium: 'À SURVEILLER',
};

const PRIORITY_TONE: Record<OperationalDecision['priority'], string> = {
  critical: 'bg-red-500/20 text-red-200 border-red-400/40',
  high: 'bg-orange-500/20 text-orange-100 border-orange-400/40',
  medium: 'bg-blue-500/15 text-blue-100 border-blue-400/30',
};

export const DispatcherDecisionPanel: React.FC<{
  decisions: OperationalDecision[];
  capacitySummary: CapacitySummary;
  onNavigate?: NavigateHandler;
}> = ({ decisions, capacitySummary, onNavigate }) => {
  const primary = decisions[0];
  const secondary = decisions.slice(1, 4);

  if (!primary) {
    return (
      <article className="rounded-[24px] border border-green-400/25 bg-green-500/10 p-5">
        <p className="text-xs font-black uppercase tracking-wide text-green-200">Aucune action requise</p>
        <p className="mt-2 text-sm text-white/85">
          {capacitySummary.sufficient
            ? `Capacité suffisante pour les 2 prochaines heures · ${capacitySummary.available} chauffeur(s) disponible(s) · ~${capacitySummary.expectedVolume2h} missions`
            : capacitySummary.headline}
        </p>
        {capacitySummary.sufficient && (
          <p className="mt-1 text-xs text-white/55">Surveiller la file dispatch et les alertes terrain.</p>
        )}
      </article>
    );
  }

  return (
    <article className="space-y-3">
      <div className="rounded-[24px] border border-red-400/35 bg-gradient-to-br from-red-500/15 to-orange-500/10 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
            Action requise
          </span>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${PRIORITY_TONE[primary.priority]}`}>
            {PRIORITY_LABEL[primary.priority]}
          </span>
          {primary.delayMinutes != null && primary.delayMinutes > 0 && (
            <span className="text-xs font-bold text-orange-200">Retard estimé · {primary.delayMinutes} min</span>
          )}
        </div>

        <p className="mt-4 font-mono text-lg font-black text-white">{primary.reference}</p>

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-white/45">Observation</dt>
            <dd className="mt-1 text-sm font-semibold text-white/85">{primary.observation}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-white/45">Impact</dt>
            <dd className="mt-1 text-sm font-semibold text-white/85">{primary.impact}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-white/45">Recommandation</dt>
            <dd className="mt-1 text-sm font-black text-green-300">{primary.suggestion}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() =>
            onNavigate?.(primary.actionSection, {
              missionId: primary.missionId,
              driverName: primary.suggestedDriverName,
            })
          }
          className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-white/90"
        >
          {primary.actionLabel}
        </button>
      </div>

      {secondary.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {secondary.map((decision) => (
            <button
              key={decision.id}
              type="button"
              onClick={() =>
                onNavigate?.(decision.actionSection, {
                  missionId: decision.missionId,
                  driverName: decision.suggestedDriverName,
                })
              }
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left hover:bg-white/10"
            >
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${PRIORITY_TONE[decision.priority]}`}>
                  {PRIORITY_LABEL[decision.priority]}
                </span>
                <span className="truncate font-mono text-xs font-black text-white">{decision.reference}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-white/65">{decision.observation}</p>
              <p className="mt-2 text-xs font-bold text-green-300">{decision.suggestion}</p>
            </button>
          ))}
        </div>
      )}
    </article>
  );
};
