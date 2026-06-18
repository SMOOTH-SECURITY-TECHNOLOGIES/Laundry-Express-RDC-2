import React from 'react';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { MobileButton } from '../ui/MobileButton';
import { CARD, TYPO, SPACING, MISSION_STATUS_MAP, type StatusTone } from '../ui/tokens';
import type { LogisticsStatus } from './logistics-types';

interface MobileMissionCardProps {
  missionId: string;
  status: LogisticsStatus;
  statusLabel: string;
  customerName: string;
  pickupLabel: string;
  deliveryLabel: string;
  etaLabel?: string;
  distanceLabel?: string;
  driverName?: string;
  vehiclePlate?: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onCallDriver?: () => void;
  onCallCustomer?: () => void;
  onProof?: () => void;
  onIncident?: () => void;
  onOpenDetails?: () => void;
}

const secondaryActions = (
  onCallDriver?: () => void,
  onCallCustomer?: () => void,
  onProof?: () => void,
  onIncident?: () => void,
) =>
  [
    onCallDriver ? { label: 'Appeler', icon: 'phone' as const, onClick: onCallDriver, tone: 'success' as const } : null,
    onCallCustomer ? { label: 'Client', icon: 'user' as const, onClick: onCallCustomer, tone: 'info' as const } : null,
    onProof ? { label: 'Preuve', icon: 'camera' as const, onClick: onProof, tone: 'info' as const } : null,
    onIncident ? { label: 'Incident', icon: 'warning' as const, onClick: onIncident, tone: 'danger' as const } : null,
  ].filter(Boolean) as Array<{ label: string; icon: React.ComponentProps<typeof Icon>['name']; onClick: () => void; tone: StatusTone }>;

export const MobileMissionCard: React.FC<MobileMissionCardProps> = ({
  missionId,
  status,
  statusLabel,
  customerName,
  pickupLabel,
  deliveryLabel,
  etaLabel,
  distanceLabel,
  driverName,
  vehiclePlate,
  primaryActionLabel,
  onPrimaryAction,
  onCallDriver,
  onCallCustomer,
  onProof,
  onIncident,
  onOpenDetails,
}) => {
  const tone: StatusTone = MISSION_STATUS_MAP[status] || 'neutral';
  const actions = secondaryActions(onCallDriver, onCallCustomer, onProof, onIncident);

  return (
    <article className={`${CARD.base} overflow-hidden`}>
      {/* Header */}
      <div className={`${SPACING.cardPad} border-b border-surface-border-subtle`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={TYPO.label}>Mission active</p>
            <h3 className={`mt-1 ${TYPO.pageTitle} text-xl`}>{missionId}</h3>
            <p className={`mt-0.5 ${TYPO.sectionSubtitle}`}>{customerName}</p>
          </div>
          <StatusChip label={statusLabel} tone={tone} size="md" />
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
              <p className={`truncate ${TYPO.cardTitle}`}>{pickupLabel}</p>
            </div>
          </div>
          <div className="ml-3.5 h-4 border-l-2 border-dashed border-surface-border" />
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Icon name="check" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={TYPO.label}>Destination</p>
              <p className={`truncate ${TYPO.cardTitle}`}>{deliveryLabel}</p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`${CARD.muted} p-3 text-center`}>
            <p className={TYPO.label}>ETA</p>
            <p className={`mt-0.5 ${TYPO.value}`}>{etaLabel || '--'}</p>
          </div>
          <div className={`${CARD.muted} p-3 text-center`}>
            <p className={TYPO.label}>Distance</p>
            <p className={`mt-0.5 ${TYPO.value}`}>{distanceLabel || '--'}</p>
          </div>
        </div>

        {/* Chauffeur / Véhicule */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`${CARD.muted} p-3`}>
            <p className={TYPO.label}>Chauffeur</p>
            <p className={`mt-0.5 truncate ${TYPO.cardTitle}`}>{driverName || 'A assigner'}</p>
          </div>
          <div className={`${CARD.muted} p-3`}>
            <p className={TYPO.label}>Véhicule</p>
            <p className={`mt-0.5 truncate ${TYPO.cardTitle}`}>{vehiclePlate || 'À confirmer'}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`${SPACING.cardPad} pt-0 space-y-2`}>
        <MobileButton
          label={primaryActionLabel}
          icon="play"
          variant="primary"
          size="lg"
          onClick={onPrimaryAction}
        />
        <div className="grid grid-cols-2 gap-2">
          {actions.map((item) => (
            <MobileButton
              key={item.label}
              label={item.label}
              icon={item.icon}
              variant="secondary"
              size="sm"
              onClick={item.onClick}
            />
          ))}
        </div>
        {onOpenDetails && (
          <MobileButton
            label="Voir détails"
            variant="ghost"
            size="sm"
            onClick={onOpenDetails}
          />
        )}
      </div>
    </article>
  );
};

export default MobileMissionCard;
