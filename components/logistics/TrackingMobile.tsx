import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { MobileButton } from '../ui/MobileButton';
import { HorizontalFilter, type FilterOption } from '../ui/HorizontalFilter';
import { CARD, TYPO, SPACING, MISSION_STATUS_MAP, type StatusTone } from '../ui/tokens';
import type { LogisticsStatus } from './logistics-types';

type TrackingStatus = 'available' | 'busy' | 'delayed' | 'offline';
type TrackingFilter = 'all' | TrackingStatus;

interface LiveTrip {
  id: string;
  taskId: string;
  status: LogisticsStatus;
  statusLabel: string;
  trackingStatus: TrackingStatus;
  origin: string;
  destination: string;
  etaMinutes: number;
  distanceKm: number;
  customerName: string;
  driverName: string;
  vehiclePlate: string;
}

interface TrackingMobileProps {
  trips: LiveTrip[];
  onSelectTrip: (id: string) => void;
  onRefresh: () => void;
  lastSyncAt: string;
}

const STATUS_CONFIG: Record<TrackingStatus, { label: string; tone: StatusTone }> = {
  available: { label: 'Disponible', tone: 'success' },
  busy: { label: 'Occupé', tone: 'info' },
  delayed: { label: 'Retard', tone: 'warning' },
  offline: { label: 'Hors ligne', tone: 'danger' },
};

const TRACKING_FILTERS: FilterOption[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'available', label: 'Disponibles' },
  { key: 'busy', label: 'Occupés' },
  { key: 'delayed', label: 'Retards' },
  { key: 'offline', label: 'Hors ligne' },
];

export const TrackingMobile: React.FC<TrackingMobileProps> = ({
  trips,
  onSelectTrip,
  onRefresh,
  lastSyncAt,
}) => {
  const [activeFilter, setActiveFilter] = useState<TrackingFilter>('all');
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');

  const filteredTrips = useMemo(
    () => trips.filter((t) => activeFilter === 'all' || t.trackingStatus === activeFilter),
    [activeFilter, trips]
  );

  const filterCounts: Record<TrackingFilter, number> = {
    all: trips.length,
    available: trips.filter((t) => t.trackingStatus === 'available').length,
    busy: trips.filter((t) => t.trackingStatus === 'busy').length,
    delayed: trips.filter((t) => t.trackingStatus === 'delayed').length,
    offline: trips.filter((t) => t.trackingStatus === 'offline').length,
  };

  const metrics = {
    tracked: trips.length,
    delayed: trips.filter((t) => t.trackingStatus === 'delayed').length,
    offline: trips.filter((t) => t.trackingStatus === 'offline').length,
    avgEta: Math.round(trips.reduce((sum, t) => sum + t.etaMinutes, 0) / Math.max(1, trips.length)),
  };

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="map" className="h-5 w-5 text-brand-blue" />
          <h2 className={TYPO.sectionTitle}>Live Tracking</h2>
        </div>
        <MobileButton label="Actualiser" icon="arrow-path" variant="secondary" size="sm" onClick={onRefresh} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Suivies', value: metrics.tracked, tone: 'info' as const },
          { label: 'Retards', value: metrics.delayed, tone: 'warning' as const },
          { label: 'Hors ligne', value: metrics.offline, tone: 'danger' as const },
          { label: 'ETA moyen', value: `${metrics.avgEta} min`, tone: 'success' as const },
        ].map((m) => (
          <div key={m.label} className={`${CARD.muted} p-3 text-center`}>
            <p className={TYPO.label}>{m.label}</p>
            <p className={`mt-0.5 ${TYPO.value} text-lg`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <HorizontalFilter
        options={TRACKING_FILTERS.map((opt) => ({
          ...opt,
          count: filterCounts[opt.key as TrackingFilter],
        }))}
        activeKey={activeFilter}
        onChange={(key) => setActiveFilter(key as TrackingFilter)}
      />

      {/* Active Trip Detail */}
      {selectedTrip && (
        <div className={`${CARD.base} overflow-hidden`}>
          <div className={`${SPACING.cardPad} border-b border-surface-border-subtle`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={TYPO.label}>Mission active</p>
                <h3 className={`mt-0.5 ${TYPO.pageTitle} text-lg`}>{selectedTrip.taskId}</h3>
                <p className={`mt-0.5 ${TYPO.sectionSubtitle}`}>{selectedTrip.origin} → {selectedTrip.destination}</p>
              </div>
              <StatusChip label={STATUS_CONFIG[selectedTrip.trackingStatus].label} tone={STATUS_CONFIG[selectedTrip.trackingStatus].tone} size="md" />
            </div>
          </div>
          <div className={`${SPACING.cardPad}`}>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className={`${CARD.muted} p-2`}>
                <p className={TYPO.label}>Chauffeur</p>
                <p className={`mt-0.5 truncate ${TYPO.cardTitle}`}>{selectedTrip.driverName}</p>
              </div>
              <div className={`${CARD.muted} p-2`}>
                <p className={TYPO.label}>Véhicule</p>
                <p className={`mt-0.5 truncate ${TYPO.cardTitle}`}>{selectedTrip.vehiclePlate}</p>
              </div>
              <div className={`${CARD.muted} p-2 text-center`}>
                <p className={TYPO.label}>ETA</p>
                <p className={`mt-0.5 ${TYPO.value} text-sm`}>{selectedTrip.etaMinutes} min</p>
              </div>
              <div className={`${CARD.muted} p-2 text-center`}>
                <p className={TYPO.label}>Distance</p>
                <p className={`mt-0.5 ${TYPO.value} text-sm`}>{selectedTrip.distanceKm} km</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip List */}
      <div className="space-y-2">
        {filteredTrips.map((trip) => {
          const tone: StatusTone = MISSION_STATUS_MAP[trip.status] || 'neutral';
          const isSelected = trip.id === selectedTripId;

          return (
            <button
              key={trip.id}
              type="button"
              onClick={() => {
                setSelectedTripId(trip.id);
                onSelectTrip(trip.id);
              }}
              className={`w-full ${CARD.interactive} p-3 text-left ${isSelected ? 'ring-2 ring-brand-blue' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-black text-brand-blue">{trip.taskId}</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-content-primary">{trip.customerName}</p>
                  <p className="mt-0.5 text-xs text-content-muted">
                    {trip.driverName} · {trip.origin} → {trip.destination}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <StatusChip label={STATUS_CONFIG[trip.trackingStatus].label} tone={STATUS_CONFIG[trip.trackingStatus].tone} size="xs" />
                  <p className="text-xs font-bold text-content-primary">{trip.etaMinutes} min</p>
                </div>
              </div>
            </button>
          );
        })}

        {filteredTrips.length === 0 && (
          <div className={`${CARD.base} p-8 text-center`}>
            <Icon name="check" className="mx-auto h-8 w-8 text-green-500" />
            <p className="mt-2 text-sm font-bold text-content-muted">Aucun trajet dans ce filtre</p>
          </div>
        )}
      </div>

      {/* Sync Info */}
      <p className="text-center text-[10px] text-content-muted">
        Dernière synchro: {lastSyncAt} · {filteredTrips.length} trajets
      </p>
    </div>
  );
};

export default TrackingMobile;
