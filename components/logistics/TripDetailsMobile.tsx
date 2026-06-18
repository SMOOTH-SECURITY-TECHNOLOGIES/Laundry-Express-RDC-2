import React, { useState } from 'react';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { MobileButton } from '../ui/MobileButton';
import { DeliveryTimeline, type DeliveryStep } from '../ui/DeliveryTimeline';
import { CARD, TYPO, SPACING, MISSION_STATUS_MAP, type StatusTone } from '../ui/tokens';
import { BottomSheet } from '../ui/BottomSheet';
import type { LogisticsStatus } from './logistics-types';

/* ─── Types ─── */
interface DetailedTrip {
  id: string;
  taskId: string;
  status: LogisticsStatus;
  origin: string;
  destination: string;
  distanceKm: number;
  etaMinutes: number;
  estimatedDurationMinutes: number;
  customerName: string;
  driverName: string;
  vehiclePlate: string;
  clientPhone: string;
  driverPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  createdAt: string;
  assignedAt?: string;
  pickupAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
}

interface TripDetailsMobileProps {
  trip: DetailedTrip;
  onBack: () => void;
  onCallDriver: () => void;
  onCallCustomer: () => void;
  onIncident: () => void;
  onDelay: () => void;
  onUpdateStatus: (status: LogisticsStatus) => void;
}

/* ─── Config ─── */
const STATUS_LABELS: Record<LogisticsStatus, string> = {
  pending: 'En attente',
  assigned: 'Assigné',
  in_transit: 'En route',
  delivered: 'Livré',
  delayed: 'Retard',
  failed: 'Incident',
  cancelled: 'Annulé',
};

const buildTimeline = (trip: DetailedTrip): DeliveryStep[] => {
  const completed: DeliveryStep['label'][] = ['created'];
  if (['assigned', 'in_transit', 'delayed', 'delivered'].includes(trip.status)) completed.push('assigned');
  if (['in_transit', 'delayed', 'delivered'].includes(trip.status)) completed.push('pickup', 'in_transit');
  if (trip.status === 'delivered') completed.push('delivered');

  return [
    { id: 'created', label: 'Créé', timestamp: trip.createdAt, completed: completed.includes('created') },
    { id: 'assigned', label: 'Assigné', timestamp: trip.assignedAt || 'À venir', completed: completed.includes('assigned') },
    { id: 'pickup', label: 'Ramassage', timestamp: trip.pickupAt || 'À venir', completed: completed.includes('pickup') },
    { id: 'in_transit', label: 'En route', timestamp: trip.inTransitAt || 'À venir', completed: completed.includes('in_transit') },
    { id: 'delivered', label: 'Livré', timestamp: trip.deliveredAt || `ETA ${trip.etaMinutes} min`, completed: completed.includes('delivered') },
  ];
};

/* ─── Component ─── */
export const TripDetailsMobile: React.FC<TripDetailsMobileProps> = ({
  trip,
  onBack,
  onCallDriver,
  onCallCustomer,
  onIncident,
  onDelay,
  onUpdateStatus,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showIncidentSheet, setShowIncidentSheet] = useState(false);
  const [incidentType, setIncidentType] = useState<string | null>(null);

  const tone: StatusTone = MISSION_STATUS_MAP[trip.status] || 'neutral';
  const timeline = buildTimeline(trip);
  const isLive = trip.status === 'in_transit';
  const isDelivered = trip.status === 'delivered';

  const primaryAction =
    trip.status === 'assigned'
      ? { label: 'Démarrer mission', icon: 'play' as const, variant: 'success' as const }
      : trip.status === 'delivered'
        ? { label: 'Reprendre mission', icon: 'arrow-path' as const, variant: 'secondary' as const }
        : { label: 'Terminer mission', icon: 'check' as const, variant: 'success' as const };

  const INCIDENT_TYPES = [
    { key: 'traffic', label: 'Embouteillage', icon: 'warning' },
    { key: 'accident', label: 'Accident', icon: 'exclamation-circle' },
    { key: 'vehicle', label: 'Problème véhicule', icon: 'truck' },
    { key: 'customer', label: 'Client injoignable', icon: 'user' },
    { key: 'address', label: 'Adresse introuvable', icon: 'mapPin' },
    { key: 'other', label: 'Autre', icon: 'question-mark-circle' },
  ];

  return (
    <div className="min-h-screen bg-surface-page pb-24">
      {/* ─── Header ─── */}
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
          <p className="truncate text-sm font-black text-content-primary">#{trip.taskId}</p>
        </div>
        <StatusChip label={STATUS_LABELS[trip.status]} tone={tone} size="md" pulse={isLive} />
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* ─── Status Banner ─── */}
        <div className={`${CARD.base} overflow-hidden`}>
          <div className={`${SPACING.cardPad} border-b border-surface-border-subtle`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className={TYPO.label}>Statut du trajet</p>
                <h2 className={`mt-0.5 ${TYPO.pageTitle}`}>{STATUS_LABELS[trip.status]}</h2>
                <p className={`mt-0.5 ${TYPO.sectionSubtitle}`}>
                  {trip.origin} → {trip.destination}
                </p>
              </div>
              {isLive && (
                <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-black text-green-700 dark:bg-green-950/40 dark:text-green-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  LIVE
                </div>
              )}
            </div>
          </div>

          {/* ETA */}
          <div className={`${SPACING.cardPad}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="clock" className="h-4 w-4 text-content-muted" />
                <span className="text-sm text-content-muted">ETA</span>
              </div>
              <span className="text-lg font-black text-brand-blue">{trip.etaMinutes} min</span>
            </div>
          </div>
        </div>

        {/* ─── Timeline ─── */}
        <div className={`${CARD.base} p-4`}>
          <DeliveryTimeline steps={timeline} />
        </div>

        {/* ─── Contacts ─── */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`${CARD.base} p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue text-xs font-black text-white">
                {trip.driverName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-content-primary truncate">{trip.driverName}</p>
                <p className="text-[10px] text-content-muted">{trip.vehiclePlate}</p>
              </div>
            </div>
            <MobileButton label="Appeler" icon="phone" variant="secondary" size="sm" onClick={onCallDriver} />
          </div>
          <div className={`${CARD.base} p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-xs font-black text-white">
                {trip.customerName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-content-primary truncate">{trip.customerName}</p>
                <p className="text-[10px] text-content-muted">{trip.clientPhone}</p>
              </div>
            </div>
            <MobileButton label="Appeler" icon="phone" variant="secondary" size="sm" onClick={onCallCustomer} />
          </div>
        </div>

        {/* ─── Itinéraire ─── */}
        <div className={`${CARD.base} p-4 space-y-3`}>
          <p className={TYPO.label}>Itinéraire</p>
          <div className="grid grid-cols-2 gap-2">
            <div className={`${CARD.muted} p-3`}>
              <p className={TYPO.label}>Origine</p>
              <p className={`mt-0.5 truncate ${TYPO.cardTitle}`}>{trip.origin}</p>
            </div>
            <div className={`${CARD.muted} p-3`}>
              <p className={TYPO.label}>Destination</p>
              <p className={`mt-0.5 truncate ${TYPO.cardTitle}`}>{trip.destination}</p>
            </div>
            <div className={`${CARD.muted} p-3`}>
              <p className={TYPO.label}>Distance</p>
              <p className={`mt-0.5 ${TYPO.value} text-lg`}>{trip.distanceKm} km</p>
            </div>
            <div className={`${CARD.muted} p-3`}>
              <p className={TYPO.label}>Durée</p>
              <p className={`mt-0.5 ${TYPO.value} text-lg`}>{trip.estimatedDurationMinutes} min</p>
            </div>
          </div>
        </div>

        {/* ─── Véhicule ─── */}
        <div className={`${CARD.base} p-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted">
              <Icon name="truck" className="h-5 w-5 text-content-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={TYPO.label}>Véhicule</p>
              <p className={`mt-0.5 ${TYPO.cardTitle}`}>{trip.vehiclePlate}</p>
            </div>
          </div>
        </div>

        {/* ─── Actions ─── */}
        <div className="space-y-2">
          <MobileButton
            label={showActions ? 'Masquer les actions' : 'Plus d\'actions'}
            icon={showActions ? 'chevron-up' : 'chevron-down'}
            variant="ghost"
            size="sm"
            onClick={() => setShowActions(!showActions)}
          />

          {showActions && (
            <div className="space-y-2">
              <MobileButton
                label="Signaler un incident"
                icon="warning"
                variant="danger"
                size="md"
                onClick={() => setShowIncidentSheet(true)}
              />
              <MobileButton
                label="Marquer en retard"
                icon="clock"
                variant="warning"
                size="md"
                onClick={onDelay}
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── Action principale fixe en bas ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-surface-border bg-surface-card/95 p-4 backdrop-blur-lg safe-bottom md:hidden">
        <MobileButton
          label={primaryAction.label}
          icon={primaryAction.icon}
          variant={primaryAction.variant}
          size="lg"
          onClick={() => {
            if (trip.status === 'assigned') onUpdateStatus('in_transit');
            else if (trip.status === 'in_transit') onUpdateStatus('delivered');
            else if (trip.status === 'delivered') onUpdateStatus('in_transit');
            else onUpdateStatus('delivered');
          }}
        />
      </div>

      {/* ─── Incident Sheet ─── */}
      <BottomSheet
        isOpen={showIncidentSheet}
        onClose={() => { setShowIncidentSheet(false); setIncidentType(null); }}
        title="Signaler un incident"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {INCIDENT_TYPES.map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => setIncidentType(type.key)}
                className={`flex items-center gap-2 rounded-xl p-3 text-left text-xs font-bold transition ${
                  incidentType === type.key
                    ? 'border-2 border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30'
                    : 'border border-surface-border bg-surface-muted text-content-primary'
                }`}
              >
                <Icon name={type.icon as any} className="h-4 w-4 shrink-0" />
                {type.label}
              </button>
            ))}
          </div>
          <MobileButton
            label="Envoyer le rapport"
            icon="warning"
            variant="danger"
            size="md"
            disabled={!incidentType}
            onClick={() => {
              onIncident();
              setShowIncidentSheet(false);
              setIncidentType(null);
            }}
          />
        </div>
      </BottomSheet>
    </div>
  );
};

export default TripDetailsMobile;
