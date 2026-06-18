import React from 'react';
import { Icon } from '../Icon';
import { StatusChip } from './StatusChip';
import { MobileButton } from './MobileButton';
import { MISSION_STATUS_MAP, CARD, TYPO, SPACING } from './tokens';

interface MissionData {
  id: string;
  orderRef?: string;
  type: 'pickup' | 'delivery';
  status: string;
  statusLabel: string;
  clientName: string;
  clientPhone?: string;
  pickupAddress: string;
  deliveryAddress: string;
  eta?: string;
  gain?: string;
}

interface ActiveMissionCardProps {
  mission: MissionData | null;
  /** Actions selon le statut */
  onAccept?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onCallClient?: () => void;
  onOpenMap?: () => void;
  onViewMissions?: () => void;
  loading?: boolean;
}

export const ActiveMissionCard: React.FC<ActiveMissionCardProps> = ({
  mission,
  onAccept,
  onStart,
  onComplete,
  onCallClient,
  onOpenMap,
  onViewMissions,
  loading = false,
}) => {
  if (!mission) {
    return (
      <div className={`${CARD.base} p-5`}>
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-muted text-brand-blue">
            <Icon name="truck" className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={TYPO.sectionTitle}>Aucune mission active</h3>
            <p className={`mt-1 ${TYPO.sectionSubtitle}`}>
              Vous êtes libre. Nouvelles missions bientôt disponibles.
            </p>
          </div>
        </div>
        {onViewMissions && (
          <div className="mt-4">
            <MobileButton
              label="Voir les missions"
              icon="arrowRight"
              variant="secondary"
              onClick={onViewMissions}
              fullWidth
            />
          </div>
        )}
      </div>
    );
  }

  const tone = MISSION_STATUS_MAP[mission.status] || 'neutral';
  const ref = mission.orderRef || mission.id.slice(0, 8);

  const primaryAction = mission.status === 'driver_assigned'
    ? { label: 'Accepter la mission', icon: 'check' as const, onClick: onAccept }
    : mission.status === 'accepted'
      ? { label: 'Démarrer la collecte', icon: 'play' as const, onClick: onStart }
      : { label: 'Marquer livrée', icon: 'check' as const, onClick: onComplete };

  return (
    <div className={`${CARD.base} overflow-hidden`}>
      {/* Header */}
      <div className={`${SPACING.cardPad} border-b border-surface-border-subtle`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={TYPO.label}>Mission active</p>
            <h3 className={`mt-1 ${TYPO.pageTitle} text-lg`}>#{ref}</h3>
            <p className={`mt-0.5 ${TYPO.sectionSubtitle}`}>
              {mission.type === 'pickup' ? 'Collecte' : 'Livraison'} · {mission.clientName}
            </p>
          </div>
          <StatusChip label={mission.statusLabel} tone={tone} pulse={mission.status === 'in_progress'} size="md" />
        </div>
      </div>

      {/* Route */}
      <div className={`${SPACING.cardPad} ${SPACING.sectionGap}`}>
        <div className={`${CARD.muted} p-3 space-y-0`}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
              <Icon name="mapPin" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={TYPO.label}>Pickup</p>
              <p className={`truncate ${TYPO.cardTitle}`}>{mission.pickupAddress}</p>
            </div>
          </div>
          <div className="ml-3.5 h-4 border-l-2 border-dashed border-surface-border" />
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Icon name="check" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={TYPO.label}>Destination</p>
              <p className={`truncate ${TYPO.cardTitle}`}>{mission.deliveryAddress}</p>
            </div>
          </div>
        </div>

        {/* KPIs en grille */}
        <div className="grid grid-cols-2 gap-2">
          {mission.eta && (
            <div className={`${CARD.muted} p-3 text-center`}>
              <p className={TYPO.label}>ETA</p>
              <p className={`mt-0.5 ${TYPO.value}`}>{mission.eta}</p>
            </div>
          )}
          {mission.gain && (
            <div className={`${CARD.muted} p-3 text-center`}>
              <p className={TYPO.label}>Gain</p>
              <p className={`mt-0.5 ${TYPO.value} text-brand-blue`}>{mission.gain}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions secondaires */}
      <div className={`${SPACING.cardPad} pt-0`}>
        <div className="grid grid-cols-2 gap-2">
          {mission.clientPhone && (
            <MobileButton
              label="Appeler"
              icon="phone"
              variant="secondary"
              size="sm"
              onClick={onCallClient}
            />
          )}
          {onOpenMap && (
            <MobileButton
              label="Carte"
              icon="mapPin"
              variant="secondary"
              size="sm"
              onClick={onOpenMap}
            />
          )}
        </div>
      </div>

      {/* Action principale */}
      <div className={`${SPACING.cardPad} pt-0`}>
        {primaryAction.onClick && (
          <MobileButton
            label={primaryAction.label}
            icon={primaryAction.icon}
            variant="primary"
            size="lg"
            loading={loading}
            onClick={primaryAction.onClick}
          />
        )}
      </div>
    </div>
  );
};

export default ActiveMissionCard;
