import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { MobileButton } from '../ui/MobileButton';
import { CARD, TYPO, SPACING, STATUS_COLORS, MISSION_STATUS_MAP, type StatusTone } from '../ui/tokens';
import { MapMarkers, type MapMarker } from './MapMarkers';
import { MissionBottomPanel, type MissionInfo } from './MissionBottomPanel';
import { GPSFallback } from './GPSFallback';
import { buildRoutePolyline, type MapBounds } from '../../lib/map-coords';

/* ─── Types ─── */
type TrackingStatus = 'available' | 'busy' | 'delayed' | 'offline';

export interface LiveTrip {
  id: string;
  taskId: string;
  status: string;
  statusLabel: string;
  trackingStatus: TrackingStatus;
  origin: string;
  destination: string;
  etaMinutes: number;
  distanceKm: number;
  customerName: string;
  driverName: string;
  driverPhone?: string;
  vehiclePlate: string;
  /** Position actuelle du chauffeur */
  driverPosition?: { lat: number; lng: number };
  /** Position pickup */
  pickupPosition?: { lat: number; lng: number };
  /** Position delivery */
  deliveryPosition?: { lat: number; lng: number };
}

interface LiveTrackingMapProps {
  trips: LiveTrip[];
  activeTripId: string;
  onSelectTrip: (id: string) => void;
  onRefresh: () => void;
  lastSyncAt: string;
  onCallDriver?: (phone?: string) => void;
  onCallClient?: () => void;
  onOpenDetails?: (tripId: string) => void;
}

/* ─── Config ─── */
const STATUS_CONFIG: Record<TrackingStatus, { label: string; tone: StatusTone }> = {
  available: { label: 'Disponible', tone: 'success' },
  busy: { label: 'Occupé', tone: 'info' },
  delayed: { label: 'Retard', tone: 'warning' },
  offline: { label: 'Hors ligne', tone: 'danger' },
};

/** Position par défaut pour Kinshasa */
const DEFAULT_CENTER = { lat: -4.325, lng: 15.325 };
const DEFAULT_BOUNDS: MapBounds = { minLat: -4.405, maxLat: -4.250, minLng: 15.250, maxLng: 15.400 };

/* ─── Component ─── */
export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  trips,
  activeTripId,
  onSelectTrip,
  onRefresh,
  lastSyncAt,
  onCallDriver,
  onCallClient,
  onOpenDetails,
}) => {
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [gpsAvailable, setGpsAvailable] = useState(true);
  const [trackingFilter, setTrackingFilter] = useState<TrackingStatus | 'all'>('all');

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsAvailable(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setGpsAvailable(true),
      () => setGpsAvailable(false),
      { timeout: 5000, maximumAge: 60000 },
    );
  }, []);

  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0];

  const filteredTrips = useMemo(() => {
    if (trackingFilter === 'all') return trips;
    return trips.filter((t) => t.trackingStatus === trackingFilter);
  }, [trips, trackingFilter]);

  const markers: MapMarker[] = useMemo(() => {
    const result: MapMarker[] = [];

    filteredTrips.forEach((trip) => {
      const isActive = trip.id === activeTripId;

      if (trip.driverPosition) {
        result.push({
          id: `driver-${trip.id}`,
          kind: 'driver',
          label: trip.driverName,
          latitude: trip.driverPosition.lat,
          longitude: trip.driverPosition.lng,
          isActive,
        });
      }

      if (trip.pickupPosition && isActive) {
        result.push({
          id: `pickup-${trip.id}`,
          kind: 'pickup',
          label: 'Pickup',
          latitude: trip.pickupPosition.lat,
          longitude: trip.pickupPosition.lng,
        });
      }

      if (trip.deliveryPosition && isActive) {
        result.push({
          id: `delivery-${trip.id}`,
          kind: 'delivery',
          label: 'Destination',
          latitude: trip.deliveryPosition.lat,
          longitude: trip.deliveryPosition.lng,
        });
      }
    });

    return result;
  }, [filteredTrips, activeTripId]);

  const activeRoutePolyline = useMemo(() => {
    if (!activeTrip) return '';
    return buildRoutePolyline(
      [activeTrip.pickupPosition, activeTrip.driverPosition, activeTrip.deliveryPosition],
      DEFAULT_BOUNDS,
    );
  }, [activeTrip]);

  const missionInfo: MissionInfo | null = activeTrip ? {
    id: activeTrip.id,
    orderRef: activeTrip.taskId,
    status: activeTrip.status,
    statusLabel: activeTrip.statusLabel,
    clientName: activeTrip.customerName,
    driverName: activeTrip.driverName,
    driverPhone: activeTrip.driverPhone,
    pickupAddress: activeTrip.origin,
    deliveryAddress: activeTrip.destination,
    eta: `${activeTrip.etaMinutes} min`,
    distance: `${activeTrip.distanceKm} km`,
  } : null;

  const filterCounts = useMemo(() => ({
    all: trips.length,
    available: trips.filter((t) => t.trackingStatus === 'available').length,
    busy: trips.filter((t) => t.trackingStatus === 'busy').length,
    delayed: trips.filter((t) => t.trackingStatus === 'delayed').length,
    offline: trips.filter((t) => t.trackingStatus === 'offline').length,
  }), [trips]);

  return (
    <div className="relative min-h-screen bg-surface-page">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b border-surface-border bg-surface-card/95 backdrop-blur safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon name="map" className="h-5 w-5 text-brand-blue" />
            <h1 className={TYPO.pageTitle}>Live Tracking</h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusChip
              label={`${filteredTrips.length} trajets`}
              tone="info"
              size="xs"
              variant="filled"
            />
            <MobileButton
              label=""
              icon="arrow-path"
              variant="secondary"
              size="sm"
              fullWidth={false}
              onClick={onRefresh}
            />
          </div>
        </div>
      </header>

      {/* ─── Filters ─── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2">
        {(['all', 'available', 'busy', 'delayed', 'offline'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setTrackingFilter(filter)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black transition ${
              trackingFilter === filter
                ? 'bg-brand-blue text-white'
                : 'bg-surface-muted text-content-muted'
            }`}
          >
            {filter === 'all' ? 'Toutes' : STATUS_CONFIG[filter].label}
            <span className={`rounded-full px-1.5 py-0.5 text-[8px] ${
              trackingFilter === filter ? 'bg-white/20' : 'bg-surface-border'
            }`}>
              {filterCounts[filter]}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Map ─── */}
      <div className="relative mx-2 mb-24 overflow-hidden rounded-2xl border border-surface-border-subtle" style={{ height: 'calc(100vh - 280px)', minHeight: '300px' }}>
        {!gpsAvailable ? (
          <GPSFallback
            reason="unavailable"
            lastKnownPosition={{ lat: -4.319, lng: 15.306, time: '2 min' }}
            onRetry={() => setGpsAvailable(true)}
            onUseFallback={() => setGpsAvailable(true)}
          />
        ) : (
          <>
            {/* Fallback map background (SVG) */}
            <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900">
              <div className="absolute inset-0 opacity-40">
                <svg viewBox="0 0 400 300" className="h-full w-full">
                  {/* Routes simplifiées */}
                  <line x1="50" y1="80" x2="350" y2="120" stroke="#cbd5e1" strokeWidth="2" />
                  <line x1="100" y1="200" x2="300" y2="60" stroke="#cbd5e1" strokeWidth="2" />
                  <line x1="20" y1="150" x2="380" y2="150" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="150" y1="20" x2="150" y2="280" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="250" y1="30" x2="250" y2="270" stroke="#cbd5e1" strokeWidth="1" />
                  {activeRoutePolyline && (
                    <polyline
                      points={activeRoutePolyline}
                      fill="none"
                      stroke="#0B5FFF"
                      strokeWidth="3"
                      strokeDasharray="8 4"
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                  )}
                </svg>
              </div>

              {/* Labels de zone */}
              <div className="absolute left-[10%] top-[15%] rounded-full bg-white/80 px-2 py-1 text-[9px] font-black text-slate-500 shadow dark:bg-slate-800 dark:text-slate-300">
                Gombe
              </div>
              <div className="absolute right-[15%] top-[25%] rounded-full bg-white/80 px-2 py-1 text-[9px] font-black text-slate-500 shadow dark:bg-slate-800 dark:text-slate-300">
                Lingwala
              </div>
              <div className="absolute bottom-[25%] left-[30%] rounded-full bg-white/80 px-2 py-1 text-[9px] font-black text-slate-500 shadow dark:bg-slate-800 dark:text-slate-300">
                Limete
              </div>
              <div className="absolute bottom-[15%] right-[20%] rounded-full bg-white/80 px-2 py-1 text-[9px] font-black text-slate-500 shadow dark:bg-slate-800 dark:text-slate-300">
                Barumbu
              </div>

              {/* Markers */}
              <MapMarkers
                markers={markers}
                center={DEFAULT_CENTER}
                bounds={DEFAULT_BOUNDS}
                onMarkerClick={(marker) => {
                  const tripId = marker.id.replace('driver-', '').replace('pickup-', '').replace('delivery-', '');
                  onSelectTrip(tripId);
                }}
              />
            </div>

            {/* GPS status badge */}
            <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-green-600 shadow dark:bg-slate-800 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              GPS actif
            </div>

            {/* Last sync */}
            <div className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-500 shadow dark:bg-slate-800 dark:text-slate-400">
              {lastSyncAt}
            </div>
          </>
        )}
      </div>

      {/* ─── Trip list (scroll horizontal) ─── */}
      <div className="px-4 pb-24">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {filteredTrips.map((trip) => {
            const tone: StatusTone = MISSION_STATUS_MAP[trip.status] || 'neutral';
            const isSelected = trip.id === activeTripId;

            return (
              <button
                key={trip.id}
                type="button"
                onClick={() => onSelectTrip(trip.id)}
                className={`min-w-[180px] shrink-0 rounded-xl p-3 text-left transition ${
                  isSelected
                    ? 'bg-brand-blue text-white'
                    : 'bg-surface-card border border-surface-border-subtle text-content-primary'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black truncate">{trip.taskId}</p>
                  <StatusChip
                    label={STATUS_CONFIG[trip.trackingStatus].label}
                    tone={isSelected ? 'success' : STATUS_CONFIG[trip.trackingStatus].tone}
                    size="xs"
                    variant={isSelected ? 'filled' : 'soft'}
                  />
                </div>
                <p className={`mt-1 text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-content-muted'}`}>
                  {trip.driverName}
                </p>
                <p className={`text-[10px] ${isSelected ? 'text-white/60' : 'text-content-muted'}`}>
                  ETA {trip.etaMinutes} min · {trip.distanceKm} km
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Bottom Panel ─── */}
      <MissionBottomPanel
        mission={missionInfo}
        isExpanded={panelExpanded}
        onToggle={() => setPanelExpanded(!panelExpanded)}
        onCallDriver={() => onCallDriver?.(activeTrip?.driverPhone)}
        onCallClient={() => onCallClient?.()}
        onOpenDetails={() => onOpenDetails?.(activeTrip?.id || activeTripId)}
      />
    </div>
  );
};

export default LiveTrackingMap;
