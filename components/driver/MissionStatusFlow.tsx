import React from 'react';
import { Icon } from '../Icon';
import { CARD, TYPO, STATUS_COLORS, type StatusTone } from '../ui/tokens';

/**
 * Workflow séquentiel du chauffeur :
 *   1. driver_assigned  → Accepter
 *   2. accepted          → Démarrer (en route pickup)
 *   3. in_transit        → Arrivé au pickup / En livraison
 *   4. delivering        → Marquer livrée
 *   5. completed         → Terminé
 */

export type MissionStep =
  | 'driver_assigned'
  | 'accepted'
  | 'in_transit_pickup'
  | 'in_transit_delivery'
  | 'completed';

interface StepDef {
  id: MissionStep;
  label: string;
  icon: string;
  tone: StatusTone;
}

const STEPS: StepDef[] = [
  { id: 'driver_assigned', label: 'Assignée', icon: 'user', tone: 'warning' },
  { id: 'accepted', label: 'Acceptée', icon: 'check', tone: 'info' },
  { id: 'in_transit_pickup', label: 'En route pickup', icon: 'mapPin', tone: 'info' },
  { id: 'in_transit_delivery', label: 'En livraison', icon: 'truck', tone: 'info' },
  { id: 'completed', label: 'Livrée', icon: 'check', tone: 'success' },
];

const STEP_INDEX: Record<MissionStep, number> = {
  driver_assigned: 0,
  accepted: 1,
  in_transit_pickup: 2,
  in_transit_delivery: 3,
  completed: 4,
};

interface MissionStatusFlowProps {
  currentStep: MissionStep;
  /** Mapping backend status → step interne */
  backendStatus?: string;
}

const fromBackendStatus = (status?: string): MissionStep => {
  switch (status) {
    case 'driver_assigned': return 'driver_assigned';
    case 'accepted': return 'accepted';
    case 'in_progress': return 'in_transit_pickup';  // par défaut pickup
    case 'completed': case 'delivered': return 'completed';
    default: return 'driver_assigned';
  }
};

export const MissionStatusFlow: React.FC<MissionStatusFlowProps> = ({
  currentStep: propStep,
  backendStatus,
}) => {
  const currentStep = backendStatus ? fromBackendStatus(backendStatus) : propStep;
  const currentIdx = STEP_INDEX[currentStep];

  return (
    <div className={`${CARD.base} p-4`}>
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;
          const colors = STATUS_COLORS[isCompleted || isCurrent ? step.tone : 'neutral'];

          return (
            <React.Fragment key={step.id}>
              {/* Cercle */}
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition-all ${
                    isCompleted
                      ? `${colors.bgSolid} ${colors.textSolid}`
                      : isCurrent
                        ? `${colors.bgSolid} ${colors.textSolid} ring-4 ${colors.ring}`
                        : 'bg-surface-muted text-content-muted'
                  }`}
                >
                  <Icon
                    name={isCompleted ? 'check' : (step.icon as any)}
                    className="h-4 w-4"
                  />
                </span>
                <span
                  className={`text-[9px] font-bold text-center leading-tight ${
                    isCompleted || isCurrent ? 'text-content-primary' : 'text-content-muted'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Ligne */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-1 mt-[-16px]">
                  <div
                    className={`h-0.5 rounded-full transition-colors ${
                      i < currentIdx ? colors.bgSolid : 'bg-surface-muted'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default MissionStatusFlow;
