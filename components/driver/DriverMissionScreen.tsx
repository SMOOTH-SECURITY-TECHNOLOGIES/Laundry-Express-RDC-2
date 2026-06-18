import React, { useState } from 'react';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { DeliveryTimeline, type DeliveryStep } from '../ui/DeliveryTimeline';
import { BottomSheet } from '../ui/BottomSheet';
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

const getTimelineSteps = (status?: string): DeliveryStep[] => [
  { id: 'assigned', label: 'Assignée', completed: ['accepted', 'in_progress', 'completed'].includes(status || '') },
  { id: 'pickup', label: 'En route pickup', completed: ['in_progress', 'completed'].includes(status || ''), current: status === 'accepted' },
  { id: 'collected', label: 'Articles récupérés', completed: status === 'completed' },
  { id: 'transit', label: 'En route livraison', completed: false, current: status === 'in_progress' },
  { id: 'delivered', label: 'Livrée', completed: false },
];

interface DriverMissionScreenProps {
  mission: LogisticsTask;
  onBack: () => void;
  onAction: () => void;
  onComplete: () => void;
  onCallClient: () => void;
  onOpenMap: () => void;
  onOpenProof: () => void;
  isUpdating: boolean;
}

export const DriverMissionScreen: React.FC<DriverMissionScreenProps> = ({
  mission,
  onBack,
  onAction,
  onComplete,
  onCallClient,
  onOpenMap,
  onOpenProof,
  isUpdating,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const ref = mission.order_number || mission.order_id?.slice(0, 8) || mission.id.slice(0, 8);
  const status = mission.status || 'pending';
  const clientName = getTaskClientName(mission);
  const clientPhone = getTaskPhone(mission);
  const pickup = getTaskPickupAddress(mission);
  const delivery = getTaskDeliveryAddress(mission);
  const steps = getTimelineSteps(status);

  const tone: StatusTone = MISSION_STATUS_MAP[status] || 'neutral';
  const statusLabel =
    status === 'driver_assigned' ? 'Assignée'
      : status === 'accepted' ? 'Acceptée'
        : status === 'in_progress' ? 'En cours'
          : 'Terminée';

  const actionLabel =
    status === 'driver_assigned' ? 'Accepter'
      : status === 'accepted' ? 'Démarrer la collecte'
        : status === 'in_progress' ? 'Livraison terminée'
          : 'Marquer terminée';

  return (
    <div className="min-h-screen bg-surface-page pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-surface-border bg-surface-card/95 px-4 backdrop-blur safe-top">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-content-muted hover:bg-surface-muted"
          aria-label="Retour"
        >
          <Icon name="arrowRight" className="h-5 w-5 rotate-180" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-content-primary">Mission #{ref}</p>
        </div>
        <StatusChip label={statusLabel} tone={tone} pulse={status === 'in_progress'} size="md" />
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* Timeline */}
        <div className={`${CARD.base} p-4`}>
          <DeliveryTimeline steps={steps} />
        </div>

        {/* Client */}
        <div className={`${CARD.base} p-4`}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
              <Icon name="user" className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={TYPO.label}>Client</p>
              <p className={TYPO.cardTitle}>{clientName}</p>
              {clientPhone && <p className={TYPO.cardBody}>{clientPhone}</p>}
            </div>
            {clientPhone && (
              <a
                href={`tel:${clientPhone}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700"
                aria-label="Appeler le client"
              >
                <Icon name="phone" className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Itinéraire */}
        <div className={`${CARD.base} p-4 space-y-3`}>
          <p className={TYPO.label}>Itinéraire</p>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-brand-blue">
              <Icon name="mapPin" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={TYPO.label}>Pickup</p>
              <p className={`truncate ${TYPO.cardTitle}`}>{pickup}</p>
            </div>
          </div>
          <div className="ml-3.5 h-4 border-l-2 border-dashed border-surface-border" />
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Icon name="check" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={TYPO.label}>Destination</p>
              <p className={`truncate ${TYPO.cardTitle}`}>{delivery}</p>
            </div>
          </div>
        </div>

        {/* Actions secondaires */}
        <div className="grid grid-cols-2 gap-2">
          <MobileButton label="Ouvrir carte" icon="mapPin" variant="secondary" size="sm" onClick={onOpenMap} />
          <MobileButton label="Détails" icon="document-text" variant="secondary" size="sm" onClick={() => setShowDetails(true)} />
        </div>

        {/* Preuve (si en cours) */}
        {status === 'in_progress' && (
          <MobileButton
            label="Preuve de livraison"
            icon="camera"
            variant="warning"
            size="lg"
            onClick={onOpenProof}
          />
        )}
      </div>

      {/* Action principale fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-surface-border bg-surface-card/95 p-4 backdrop-blur-lg safe-bottom md:hidden">
        <MobileButton
          label={actionLabel}
          icon={status === 'completed' ? 'check' : 'play'}
          variant="primary"
          size="lg"
          loading={isUpdating}
          onClick={status === 'completed' || status === 'in_progress' ? onComplete : onAction}
        />
      </div>

      {/* Bottom sheet détails */}
      <BottomSheet isOpen={showDetails} onClose={() => setShowDetails(false)} title="Détails mission">
        <div className="space-y-2">
          {[
            ['Mission', `#${ref}`],
            ['Type', mission.task_type === 'pickup' ? 'Collecte' : 'Livraison'],
            ['Client', clientName],
            ['Téléphone', clientPhone || '—'],
            ['Pickup', pickup],
            ['Destination', delivery],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2.5">
              <span className="text-xs text-content-muted">{label}</span>
              <span className="text-sm font-black text-content-primary">{value}</span>
            </div>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};

export default DriverMissionScreen;
