import React from 'react';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { MobileButton } from '../ui/MobileButton';
import { CARD, TYPO, SPACING, MISSION_STATUS_MAP, type StatusTone } from '../ui/tokens';

/* ─── Types ─── */
export interface MissionInfo {
  id: string;
  orderRef: string;
  status: string;
  statusLabel: string;
  clientName: string;
  driverName: string;
  driverPhone?: string;
  pickupAddress: string;
  deliveryAddress: string;
  eta: string;
  distance: string;
}

interface MissionBottomPanelProps {
  mission: MissionInfo | null;
  isExpanded: boolean;
  onToggle: () => void;
  onCallDriver?: () => void;
  onCallClient?: () => void;
  onOpenDetails?: () => void;
}

/* ─── Component ─── */
export const MissionBottomPanel: React.FC<MissionBottomPanelProps> = ({
  mission,
  isExpanded,
  onToggle,
  onCallDriver,
  onCallClient,
  onOpenDetails,
}) => {
  if (!mission) return null;

  const tone: StatusTone = MISSION_STATUS_MAP[mission.status] || 'neutral';

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-out ${
        isExpanded ? 'max-h-[70vh]' : 'max-h-[120px]'
      }`}
    >
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Panel */}
      <div className={`relative ${CARD.base} border-t-2 border-brand-blue rounded-b-none overflow-hidden`}>
        {/* Handle */}
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-center py-2"
          aria-label={isExpanded ? 'Réduire' : 'Développer'}
        >
          <span className="h-1 w-10 rounded-full bg-surface-border" />
        </button>

        {/* Collapsed view */}
        <div className={`${SPACING.cardPad} pt-0`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-content-primary">#{mission.orderRef}</p>
                <StatusChip label={mission.statusLabel} tone={tone} size="xs" />
              </div>
              <p className="mt-0.5 text-xs text-content-muted truncate">
                {mission.clientName} · {mission.driverName}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-content-muted">ETA</p>
              <p className="text-lg font-black text-brand-blue">{mission.eta}</p>
            </div>
          </div>
        </div>

        {/* Expanded view */}
        {isExpanded && (
          <div className={`${SPACING.cardPad} pt-0 space-y-3 overflow-y-auto max-h-[50vh]`}>
            {/* Route */}
            <div className={`${CARD.muted} p-3 space-y-1`}>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                  <Icon name="mapPin" className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-content-muted">PICKUP</p>
                  <p className="truncate text-xs font-bold text-content-primary">{mission.pickupAddress}</p>
                </div>
              </div>
              <div className="ml-3 h-3 border-l-2 border-dashed border-surface-border" />
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <Icon name="check" className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-content-muted">DESTINATION</p>
                  <p className="truncate text-xs font-bold text-content-primary">{mission.deliveryAddress}</p>
                </div>
              </div>
            </div>

            {/* Infos */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-surface-muted p-2 text-center">
                <p className="text-[9px] font-bold text-content-muted">Distance</p>
                <p className="text-sm font-black text-content-primary">{mission.distance}</p>
              </div>
              <div className="rounded-xl bg-surface-muted p-2 text-center">
                <p className="text-[9px] font-bold text-content-muted">ETA</p>
                <p className="text-sm font-black text-brand-blue">{mission.eta}</p>
              </div>
              <div className="rounded-xl bg-surface-muted p-2 text-center">
                <p className="text-[9px] font-bold text-content-muted">Statut</p>
                <p className="text-sm font-black text-content-primary">{mission.statusLabel}</p>
              </div>
            </div>

            {/* Chauffeur */}
            <div className="flex items-center gap-3 rounded-xl bg-surface-muted p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue text-sm font-black text-white">
                {mission.driverName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-content-primary">{mission.driverName}</p>
                <p className="text-xs text-content-muted">{mission.clientName}</p>
              </div>
              {mission.driverPhone && (
                <a
                  href={`tel:${mission.driverPhone}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700"
                >
                  <Icon name="phone" className="h-4 w-4" />
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              {onCallDriver && mission.driverPhone && (
                <MobileButton
                  label="Appeler chauffeur"
                  icon="phone"
                  variant="secondary"
                  size="sm"
                  onClick={onCallDriver}
                />
              )}
              {onCallClient && (
                <MobileButton
                  label="Appeler client"
                  icon="phone"
                  variant="secondary"
                  size="sm"
                  onClick={onCallClient}
                />
              )}
              {onOpenDetails && (
                <MobileButton
                  label="Voir détails"
                  icon="document-text"
                  variant="secondary"
                  size="sm"
                  onClick={onOpenDetails}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionBottomPanel;
