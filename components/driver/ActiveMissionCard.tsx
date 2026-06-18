import React from 'react';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { MobileButton } from '../ui/MobileButton';
import { CARD, TYPO, SPACING, MISSION_STATUS_MAP, type StatusTone } from '../ui/tokens';

type LogisticsTask = {
  id: string;
  order_id?: string;
  order_number?: string;
  task_type?: string;
  status?: string;
  customer_name?: string;
  customer_phone?: string;
  pickup_contact_name?: string;
  pickup_contact_phone?: string;
  partner_name?: string;
  pickup_address_label?: string;
  pickup_address_line?: string;
  pickup_commune?: string;
  delivery_address_label?: string;
  delivery_address_line?: string;
  delivery_commune?: string;
  scheduled_at?: string;
};

const safeNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const formatMoney = (value: number) => `${safeNumber(value).toFixed(2)} $`;

const getTaskClientName = (task?: LogisticsTask | null) =>
  task?.customer_name || task?.pickup_contact_name || task?.partner_name || 'Client';

const getTaskPhone = (task?: LogisticsTask | null) =>
  task?.customer_phone || task?.pickup_contact_phone || '';

const getTaskPickupAddress = (task?: LogisticsTask | null) =>
  [task?.pickup_address_label || task?.pickup_address_line, task?.pickup_commune]
    .filter(Boolean)
    .join(', ') || 'Adresse de départ';

const getTaskDeliveryAddress = (task?: LogisticsTask | null) =>
  [task?.delivery_address_label || task?.delivery_address_line, task?.delivery_commune]
    .filter(Boolean)
    .join(', ') || "Adresse d'arrivée";

const getTaskStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    open_market: 'Disponible',
    claimed: 'Réservée',
    driver_assigned: 'Assignée',
    accepted: 'Acceptée',
    in_progress: 'En cours',
    completed: 'Terminée',
    failed: 'Échec',
    cancelled: 'Annulée',
    expired: 'Expirée',
  };
  return labels[status || ''] || 'Bientôt disponible';
};

const MONEY_PER_MISSION = 2;

interface ActiveMissionCardProps {
  mission: LogisticsTask | null;
  available: boolean;
  onAccept: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCallClient: () => void;
  onOpenMap: () => void;
  onViewMissions: () => void;
  isUpdating: boolean;
}

export const ActiveMissionCard: React.FC<ActiveMissionCardProps> = ({
  mission,
  available,
  onAccept,
  onStart,
  onComplete,
  onCallClient,
  onOpenMap,
  onViewMissions,
  isUpdating,
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
        <div className="mt-4">
          <MobileButton
            label="Voir les missions"
            icon="arrowRight"
            variant="secondary"
            onClick={onViewMissions}
          />
        </div>
        {!available && (
          <p className="mt-3 text-sm font-semibold text-orange-600">
            Passez disponible pour recevoir des missions.
          </p>
        )}
      </div>
    );
  }

  const ref = mission.order_number || mission.order_id?.slice(0, 8) || mission.id.slice(0, 8);
  const status = mission.status || 'pending';
  const tone: StatusTone = MISSION_STATUS_MAP[status] || 'neutral';

  const primaryAction =
    status === 'driver_assigned'
      ? { label: 'Accepter la mission', icon: 'check' as const, onClick: onAccept }
      : status === 'accepted'
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
              {mission.task_type === 'pickup' ? 'Collecte' : 'Livraison'}
            </p>
          </div>
          <StatusChip label={getTaskStatusLabel(status)} tone={tone} pulse={status === 'in_progress'} size="md" />
        </div>
      </div>

      {/* Route */}
      <div className={`${SPACING.cardPad} ${SPACING.sectionGap}`}>
        <div className={`${CARD.muted} p-3 space-y-0`}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
              <Icon name="user" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={TYPO.label}>Client</p>
              <p className={`truncate ${TYPO.cardTitle}`}>{getTaskClientName(mission)}</p>
            </div>
          </div>
          <div className="ml-3.5 h-4 border-l-2 border-dashed border-surface-border" />
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-brand-blue">
              <Icon name="mapPin" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={TYPO.label}>Pickup</p>
              <p className={`truncate ${TYPO.cardTitle}`}>{getTaskPickupAddress(mission)}</p>
            </div>
          </div>
          <div className="ml-3.5 h-4 border-l-2 border-dashed border-surface-border" />
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Icon name="check" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={TYPO.label}>Destination</p>
              <p className={`truncate ${TYPO.cardTitle}`}>{getTaskDeliveryAddress(mission)}</p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`${CARD.muted} p-3 text-center`}>
            <p className={TYPO.label}>ETA</p>
            <p className={`mt-0.5 ${TYPO.value}`}>
              {mission.scheduled_at
                ? new Date(mission.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                : '--'}
            </p>
          </div>
          <div className={`${CARD.muted} p-3 text-center`}>
            <p className={TYPO.label}>Gain</p>
            <p className={`mt-0.5 ${TYPO.value} text-brand-blue`}>{formatMoney(MONEY_PER_MISSION)}</p>
          </div>
        </div>
      </div>

      {/* Actions secondaires */}
      <div className={`${SPACING.cardPad} pt-0`}>
        <div className="grid grid-cols-2 gap-2">
          {getTaskPhone(mission) && (
            <MobileButton
              label="Appeler"
              icon="phone"
              variant="secondary"
              size="sm"
              onClick={onCallClient}
            />
          )}
          <MobileButton
            label="Carte"
            icon="mapPin"
            variant="secondary"
            size="sm"
            onClick={onOpenMap}
          />
        </div>
      </div>

      {/* Action principale */}
      <div className={`${SPACING.cardPad} pt-0`}>
        <MobileButton
          label={primaryAction.label}
          icon={primaryAction.icon}
          variant="primary"
          size="lg"
          loading={isUpdating}
          onClick={primaryAction.onClick}
        />
      </div>
    </div>
  );
};

export default ActiveMissionCard;
