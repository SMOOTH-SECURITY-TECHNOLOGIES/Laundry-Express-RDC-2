import React from 'react';
import { Icon } from '../Icon';
import { STATUS_COLORS, type StatusTone } from './tokens';

export interface DeliveryStep {
  /** Identifiant unique */
  id: string;
  /** Libellé de l'étape */
  label: string;
  /** Description optionnelle */
  description?: string;
  /** Horodatage affiché */
  timestamp?: string;
  /** Étape terminée */
  completed: boolean;
  /** Étape en cours (point courant) */
  current?: boolean;
  /** Statut de l'étape (détermine la couleur) */
  tone?: StatusTone;
}

interface DeliveryTimelineProps {
  steps: DeliveryStep[];
  /** Mode compact : barre de progression au lieu de la timeline verticale */
  compact?: boolean;
  /** Afficher les descriptions */
  showDescriptions?: boolean;
}

const getStepTone = (step: DeliveryStep): StatusTone => {
  if (step.tone) return step.tone;
  if (step.completed) return 'success';
  if (step.current) return 'info';
  return 'neutral';
};

const STEP_ICON: Record<string, React.ComponentProps<typeof Icon>['name']> = {
  created: 'document-text',
  assigned: 'user',
  pickup: 'mapPin',
  in_transit: 'truck',
  delivered: 'check',
  failed: 'xmark',
  cancelled: 'xmark',
};

export const DeliveryTimeline: React.FC<DeliveryTimelineProps> = ({
  steps,
  compact = false,
  showDescriptions = true,
}) => {
  if (compact) {
    const completedCount = steps.filter((s) => s.completed).length;
    const currentIdx = steps.findIndex((s) => s.current);
    const pct = currentIdx >= 0
      ? Math.round(((currentIdx + 0.5) / steps.length) * 100)
      : Math.round((completedCount / steps.length) * 100);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-content-muted">Progression</span>
          <span className="text-xs font-black text-brand-blue">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-brand-blue transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-1">
          {steps.map((step, i) => {
            const tone = getStepTone(step);
            const colors = STATUS_COLORS[tone];
            return (
              <div key={step.id} className="flex items-center gap-1 flex-1">
                <span
                  className={`h-1.5 w-full rounded-full transition-colors ${
                    step.completed ? colors.bgSolid : step.current ? `${colors.bgSolid} opacity-40` : 'bg-surface-muted'
                  }`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          {steps.map((step) => (
            <span key={step.id} className="text-[8px] font-bold text-content-muted truncate max-w-[60px] text-center">
              {step.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const tone = getStepTone(step);
        const colors = STATUS_COLORS[tone];
        const iconName = STEP_ICON[step.id] || (step.completed ? 'check' : step.current ? 'clock' : 'circle');

        return (
          <li key={step.id} className="flex gap-3 relative">
            {/* Ligne verticale */}
            {!isLast && (
              <div
                className={`absolute left-[13px] top-[28px] w-0.5 ${
                  step.completed ? colors.bgSolid : 'bg-surface-border'
                }`}
                style={{ height: 'calc(100% - 28px)' }}
              />
            )}

            {/* Cercle / Icône */}
            <div className="relative z-10 shrink-0">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                  step.completed
                    ? `${colors.bgSolid} ${colors.textSolid}`
                    : step.current
                      ? `${colors.bgSolid} ${colors.textSolid} ring-4 ${colors.ring}`
                      : `bg-surface-muted text-content-muted`
                }`}
              >
                <Icon
                  name={step.completed ? 'check' : iconName}
                  className="h-3.5 w-3.5"
                />
              </span>
            </div>

            {/* Contenu */}
            <div className={`flex-1 ${isLast ? '' : 'pb-5'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={`text-sm font-bold ${
                      step.completed || step.current ? 'text-content-primary' : 'text-content-muted'
                    }`}
                  >
                    {step.label}
                  </p>
                  {showDescriptions && step.description && (
                    <p className="mt-0.5 text-xs text-content-muted">{step.description}</p>
                  )}
                </div>
                {step.timestamp && (
                  <span className="shrink-0 text-[10px] font-bold text-content-muted">
                    {step.timestamp}
                  </span>
                )}
              </div>

              {/* Badge statut pour l'étape en cours */}
              {step.current && (
                <span
                  className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black ${colors.bg} ${colors.text}`}
                >
                  <span className={`h-1 w-1 rounded-full ${colors.dot} animate-pulse`} />
                  En cours
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default DeliveryTimeline;
