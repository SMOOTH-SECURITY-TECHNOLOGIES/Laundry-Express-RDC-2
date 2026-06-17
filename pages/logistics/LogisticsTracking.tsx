import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { MobileMissionCard } from '../../components/logistics/MobileMissionCard';
import type { LogisticsStatus, TrackingPoint, Trip, TripTimelineEvent } from '../../components/logistics/logistics-types';
import { getTrackingPoints, getTrips, type DataMode } from '../../services/logistics-api';
import { logisticsCard } from './logistics-ui';

type TrackingStatus = 'available' | 'busy' | 'delayed' | 'offline';
type TrackingFilter = 'all' | TrackingStatus;

interface LiveTrip extends Trip {
  customerName: string;
  driverName: string;
  vehiclePlate: string;
  estimatedDurationMinutes: number;
  statusLabel: string;
  trackingStatus: TrackingStatus;
}

const fallbackLiveTrips: LiveTrip[] = [
  {
    id: 'trip-001',
    taskId: 'MSN-004',
    status: 'delayed',
    statusLabel: 'Retard',
    trackingStatus: 'delayed',
    origin: 'Gombe',
    destination: 'Lingwala',
    etaMinutes: 18,
    distanceKm: 3.4,
    estimatedDurationMinutes: 32,
    customerName: 'Mama Jeanne',
    driverName: 'Tshimanga A.',
    vehiclePlate: 'KIN-042-MT',
  },
  {
    id: 'trip-002',
    taskId: 'MSN-014',
    status: 'in_transit',
    statusLabel: 'Occupé',
    trackingStatus: 'busy',
    origin: 'Limete',
    destination: 'Gombe',
    etaMinutes: 24,
    distanceKm: 6.1,
    estimatedDurationMinutes: 41,
    customerName: 'Sarah K.',
    driverName: 'Mutombo P.',
    vehiclePlate: 'KIN-118-VN',
  },
  {
    id: 'trip-003',
    taskId: 'MSN-021',
    status: 'assigned',
    statusLabel: 'Disponible',
    trackingStatus: 'available',
    origin: 'Barumbu',
    destination: 'Gombe',
    etaMinutes: 12,
    distanceKm: 2.2,
    estimatedDurationMinutes: 22,
    customerName: 'David M.',
    driverName: 'Kalonji S.',
    vehiclePlate: 'KIN-207-MT',
  },
  {
    id: 'trip-004',
    taskId: 'MSN-025',
    status: 'failed',
    statusLabel: 'Hors ligne',
    trackingStatus: 'offline',
    origin: 'Masina',
    destination: 'Limete',
    etaMinutes: 0,
    distanceKm: 0,
    estimatedDurationMinutes: 0,
    customerName: 'Grace N.',
    driverName: 'Ngoy L.',
    vehiclePlate: 'KIN-301-CR',
  },
];

const timelineEvents: TripTimelineEvent[] = [
  { id: 'tl-001', tripId: 'trip-001', label: 'created', title: 'Créé', timestamp: '10:02', completed: true },
  { id: 'tl-002', tripId: 'trip-001', label: 'assigned', title: 'Assigné', timestamp: '10:05', completed: true },
  { id: 'tl-003', tripId: 'trip-001', label: 'pickup', title: 'Ramassage', timestamp: '10:12', completed: true },
  { id: 'tl-004', tripId: 'trip-001', label: 'in_transit', title: 'En route', timestamp: '10:15', completed: true },
  { id: 'tl-005', tripId: 'trip-001', label: 'delivered', title: 'Livré', timestamp: 'ETA 10:33', completed: false },
  { id: 'tl-006', tripId: 'trip-002', label: 'created', title: 'Créé', timestamp: '09:58', completed: true },
  { id: 'tl-007', tripId: 'trip-002', label: 'assigned', title: 'Assigné', timestamp: '10:04', completed: true },
  { id: 'tl-008', tripId: 'trip-002', label: 'pickup', title: 'Ramassage', timestamp: '10:10', completed: true },
  { id: 'tl-009', tripId: 'trip-002', label: 'in_transit', title: 'En route', timestamp: '10:18', completed: true },
  { id: 'tl-010', tripId: 'trip-002', label: 'delivered', title: 'Livré', timestamp: 'ETA 10:42', completed: false },
];

const fallbackTrackingPoints: TrackingPoint[] = [
  {
    id: 'pt-veh-001',
    tripId: 'trip-001',
    kind: 'vehicle',
    label: 'KIN-042-MT',
    latitude: -4.319,
    longitude: 15.306,
    recordedAt: '2026-06-16T10:15:00.000Z',
    status: 'delayed',
    driverName: 'Tshimanga A.',
    vehiclePlate: 'KIN-042-MT',
  },
  {
    id: 'pt-pick-001',
    tripId: 'trip-001',
    kind: 'pickup',
    label: 'Pickup Gombe',
    latitude: -4.315,
    longitude: 15.308,
    recordedAt: '2026-06-16T10:05:00.000Z',
    status: 'pending',
  },
  {
    id: 'pt-drop-001',
    tripId: 'trip-001',
    kind: 'delivery',
    label: 'Delivery Lingwala',
    latitude: -4.329,
    longitude: 15.296,
    recordedAt: '2026-06-16T10:05:00.000Z',
    status: 'pending',
  },
  {
    id: 'pt-veh-002',
    tripId: 'trip-002',
    kind: 'vehicle',
    label: 'KIN-118-VN',
    latitude: -4.354,
    longitude: 15.342,
    recordedAt: '2026-06-16T10:18:00.000Z',
    status: 'in_transit',
    driverName: 'Mutombo P.',
    vehiclePlate: 'KIN-118-VN',
  },
  {
    id: 'pt-driver-003',
    tripId: 'trip-003',
    kind: 'driver',
    label: 'Kalonji S.',
    latitude: -4.333,
    longitude: 15.316,
    recordedAt: '2026-06-16T10:19:00.000Z',
    status: 'assigned',
    driverName: 'Kalonji S.',
    vehiclePlate: 'KIN-207-MT',
  },
  {
    id: 'pt-driver-004',
    tripId: 'trip-004',
    kind: 'driver',
    label: 'Ngoy L.',
    latitude: -4.391,
    longitude: 15.392,
    recordedAt: '2026-06-16T09:48:00.000Z',
    status: 'failed',
    driverName: 'Ngoy L.',
    vehiclePlate: 'KIN-301-CR',
  },
];

const statusConfig: Record<TrackingStatus, { label: string; bg: string; text: string; dot: string }> = {
  available: {
    label: 'Disponible',
    bg: 'bg-green-100 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500',
  },
  busy: {
    label: 'Occupé',
    bg: 'bg-blue-100 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  delayed: {
    label: 'Retard',
    bg: 'bg-orange-100 dark:bg-orange-950/30',
    text: 'text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  offline: {
    label: 'Hors ligne',
    bg: 'bg-slate-200 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-500',
  },
};

const tripStatusLabels: Record<LogisticsStatus, string> = {
  pending: 'En attente',
  assigned: 'Assigné',
  in_transit: 'En route',
  delivered: 'Livré',
  delayed: 'Retard',
  failed: 'Incident',
  cancelled: 'Annulé',
};

const statusToTracking = (status: LogisticsStatus): TrackingStatus => {
  if (status === 'assigned') return 'available';
  if (status === 'in_transit') return 'busy';
  if (status === 'delayed') return 'delayed';
  if (status === 'failed' || status === 'cancelled') return 'offline';
  return 'available';
};

const pointPosition = (point: TrackingPoint) => {
  const minLat = -4.405;
  const maxLat = -4.305;
  const minLng = 15.285;
  const maxLng = 15.405;
  const x = ((point.longitude - minLng) / (maxLng - minLng)) * 100;
  const y = 100 - ((point.latitude - minLat) / (maxLat - minLat)) * 100;
  return {
    left: `${Math.min(92, Math.max(8, x))}%`,
    top: `${Math.min(88, Math.max(12, y))}%`,
  };
};

const pointIcon: Record<TrackingPoint['kind'], React.ComponentProps<typeof Icon>['name']> = {
  vehicle: 'truck',
  driver: 'user',
  pickup: 'mapPin',
  delivery: 'check',
};

const toLiveTrip = (trip: Trip): LiveTrip => {
  const trackingStatus = statusToTracking(trip.status);
  return {
    ...trip,
    customerName: trip.customerName || 'Client Laundry',
    driverName: trip.driverName || 'Chauffeur à assigner',
    vehiclePlate: trip.vehiclePlate || 'Véhicule à confirmer',
    estimatedDurationMinutes: trip.estimatedDurationMinutes ?? 30,
    statusLabel: statusConfig[trackingStatus].label,
    trackingStatus,
  };
};

export const LogisticsTracking: React.FC = () => {
  const [activeTripId, setActiveTripId] = useState(() => sessionStorage.getItem('logisticsFocusTripId') || 'trip-001');
  const [liveTrips, setLiveTrips] = useState<LiveTrip[]>(fallbackLiveTrips);
  const [trackingPoints, setTrackingPoints] = useState<TrackingPoint[]>(fallbackTrackingPoints);
  const [dataMode, setDataMode] = useState<DataMode>('degraded');
  const [geoAvailable, setGeoAvailable] = useState(() => typeof navigator !== 'undefined' && 'geolocation' in navigator);
  const [tripOverrides, setTripOverrides] = useState<Record<string, LogisticsStatus>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [trackingFilter, setTrackingFilter] = useState<TrackingFilter>('all');
  const [lastSyncAt, setLastSyncAt] = useState('10:19');

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getTrips(fallbackLiveTrips),
      getTrackingPoints(fallbackTrackingPoints),
    ]).then(([tripResult, pointResult]) => {
      if (!mounted) return;
      const nextTrips = tripResult.data.map(toLiveTrip);
      setLiveTrips(nextTrips);
      setTrackingPoints(pointResult.data);
      setDataMode(tripResult.mode === 'backend' || pointResult.mode === 'backend' ? 'backend' : 'degraded');
      if (nextTrips.length > 0 && !nextTrips.some((trip) => trip.id === activeTripId)) {
        setActiveTripId(nextTrips[0].id);
        sessionStorage.setItem('logisticsFocusTripId', nextTrips[0].id);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const activeTripBase = liveTrips.find((trip) => trip.id === activeTripId) ?? liveTrips[0];
  const activeStatus = tripOverrides[activeTripBase.id] ?? activeTripBase.status;
  const activeTrackingStatus = statusToTracking(activeStatus);
  const activeTrip = {
    ...activeTripBase,
    status: activeStatus,
    statusLabel: statusConfig[activeTrackingStatus].label,
    trackingStatus: activeTrackingStatus,
  };
  const activePoints = useMemo(
    () => trackingPoints.filter((point) => point.tripId === activeTrip.id),
    [trackingPoints, activeTrip.id]
  );
  const activeTimeline = timelineEvents.filter((event) => event.tripId === activeTrip.id);
  const filteredTrips = useMemo(
    () =>
      liveTrips
        .map((trip) => {
          const status = tripOverrides[trip.id] ?? trip.status;
          const trackingStatus = statusToTracking(status);
          return { ...trip, status, trackingStatus, statusLabel: statusConfig[trackingStatus].label };
        })
        .filter((trip) => trackingFilter === 'all' || trip.trackingStatus === trackingFilter),
    [liveTrips, trackingFilter, tripOverrides]
  );
  const visibleTripIds = new Set(filteredTrips.map((trip) => trip.id));
  const visiblePoints = trackingPoints.filter((point) => visibleTripIds.has(point.tripId));
  const trackingMetrics = {
    tracked: liveTrips.length,
    delayed: liveTrips.filter((trip) => statusToTracking(tripOverrides[trip.id] ?? trip.status) === 'delayed').length,
    offline: liveTrips.filter((trip) => statusToTracking(tripOverrides[trip.id] ?? trip.status) === 'offline').length,
    averageEta: Math.round(
      liveTrips.reduce((total, trip) => total + (trip.etaMinutes ?? 0), 0) / Math.max(1, liveTrips.length)
    ),
  };
  const filterCounts: Record<TrackingFilter, number> = {
    all: liveTrips.length,
    available: liveTrips.filter((trip) => statusToTracking(tripOverrides[trip.id] ?? trip.status) === 'available').length,
    busy: liveTrips.filter((trip) => statusToTracking(tripOverrides[trip.id] ?? trip.status) === 'busy').length,
    delayed: trackingMetrics.delayed,
    offline: trackingMetrics.offline,
  };
  const activeRoutePoints = activePoints
    .map((point) => pointPosition(point))
    .map((position) => `${parseFloat(position.left)},${parseFloat(position.top)}`)
    .join(' ');

  const updateTripStatus = (status: LogisticsStatus) => {
    setTripOverrides((current) => ({ ...current, [activeTrip.id]: status }));
    setActionMessage(`Statut mis à jour: ${tripStatusLabels[status]}`);
  };

  const focusTrip = (tripId: string) => {
    setActiveTripId(tripId);
    sessionStorage.setItem('logisticsFocusTripId', tripId);
  };

  const refreshTracking = () => {
    const nextSync = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setLastSyncAt(nextSync);
    setActionMessage(`Positions actualisées à ${nextSync}`);
  };

  const openTripDetails = () => {
    sessionStorage.setItem('logisticsFocusTripId', activeTrip.id);
  };

  const primaryActionLabel =
    activeTrip.status === 'assigned'
      ? 'Démarrer mission'
      : activeTrip.status === 'delivered'
        ? 'Reprendre mission'
        : 'Terminer mission';

  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.45fr_0.75fr]">
      <section className={`${logisticsCard} overflow-hidden`}>
        <div className={`border-b px-4 py-3 text-sm font-bold ${
          dataMode === 'backend'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-orange-200 bg-orange-50 text-orange-700'
        }`}>
          {dataMode === 'backend' ? 'Tracking connecté au backend' : 'Mode dégradé — dernières positions locales'}
        </div>
        <div className="flex flex-col gap-4 border-b border-surface-border-subtle p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="map" className="h-5 w-5 text-brand-blue" />
              <h2 className="text-lg font-black text-content-primary">Live Tracking</h2>
            </div>
            <p className="mt-1 text-sm text-content-muted">Véhicules, chauffeurs, missions et points pickup/delivery.</p>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
            {Object.entries(statusConfig).map(([status, config]) => (
              <span key={status} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-black sm:py-1 ${config.bg} ${config.text}`}>
                <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                {config.label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-3 border-b border-surface-border-subtle p-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Missions suivies', trackingMetrics.tracked],
            ['Retards live', trackingMetrics.delayed],
            ['Hors ligne', trackingMetrics.offline],
            ['ETA moyen', `${trackingMetrics.averageEta} min`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-surface-muted p-4">
              <p className="text-xs font-bold text-content-muted">{label}</p>
              <p className="mt-2 text-2xl font-black text-content-primary">{value}</p>
            </div>
          ))}
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto border-b border-surface-border-subtle px-5 py-4">
          {([
            ['all', 'Toutes'],
            ['available', 'Disponibles'],
            ['busy', 'Occupés'],
            ['delayed', 'Retards'],
            ['offline', 'Hors ligne'],
          ] as [TrackingFilter, string][]).map(([filter, label]) => (
            <button
              key={filter}
              type="button"
              onClick={() => setTrackingFilter(filter)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-black ${
                trackingFilter === filter ? 'bg-brand-blue text-white' : 'bg-surface-muted text-content-muted hover:bg-surface-page'
              }`}
            >
              {label}
              <span className={trackingFilter === filter ? 'text-white/80' : 'text-content-muted'}>{filterCounts[filter]}</span>
            </button>
          ))}
        </div>

        {!geoAvailable && (
          <div className="mx-5 mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-200">
            Géolocalisation indisponible. Affichage fallback sur les dernières positions connues.
          </div>
        )}

        <div className="px-3 pt-3 sm:px-5 sm:pt-5 xl:hidden">
          <MobileMissionCard
            missionId={activeTrip.taskId}
            status={activeTrip.status}
            statusLabel={activeTrip.statusLabel}
            customerName={activeTrip.customerName}
            pickupLabel={activeTrip.origin}
            deliveryLabel={activeTrip.destination}
            etaLabel={`${activeTrip.etaMinutes} min`}
            distanceLabel={`${activeTrip.distanceKm} km`}
            driverName={activeTrip.driverName}
            vehiclePlate={activeTrip.vehiclePlate}
            primaryActionLabel={primaryActionLabel}
            onPrimaryAction={() => updateTripStatus(activeTrip.status === 'delivered' ? 'in_transit' : 'delivered')}
            onCallDriver={() => setActionMessage(`Contact chauffeur: ${activeTrip.driverName}`)}
            onCallCustomer={() => setActionMessage(`Contact client: ${activeTrip.customerName}`)}
            onProof={() => setActionMessage(`Preuve demandée pour ${activeTrip.taskId}`)}
            onIncident={() => updateTripStatus('failed')}
            onOpenDetails={() => {
              openTripDetails();
              window.location.hash = 'trip-details';
            }}
          />
        </div>

        <div className="p-3 sm:p-5">
          <div className="relative min-h-[310px] overflow-hidden rounded-2xl border border-surface-border-subtle bg-slate-100 sm:min-h-[420px] dark:bg-slate-900">
            <div className="absolute inset-0 opacity-70">
              <div className="absolute left-[12%] top-[18%] h-[68%] w-[2px] rotate-[24deg] bg-white/70 dark:bg-white/10" />
              <div className="absolute left-[28%] top-[10%] h-[82%] w-[2px] -rotate-[18deg] bg-white/70 dark:bg-white/10" />
              <div className="absolute left-[8%] top-[44%] h-[2px] w-[84%] bg-white/70 dark:bg-white/10" />
              <div className="absolute left-[18%] top-[64%] h-[2px] w-[68%] rotate-[-10deg] bg-white/70 dark:bg-white/10" />
            </div>

            {activeRoutePoints && (
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  points={activeRoutePoints}
                  fill="none"
                  stroke="rgb(37 99 235)"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  strokeWidth="1.2"
                />
              </svg>
            )}

            <div className="absolute left-[8%] top-[12%] rounded-full bg-white/80 px-2 py-1 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              Gombe
            </div>
            <div className="absolute right-[12%] top-[28%] rounded-full bg-white/80 px-2 py-1 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              Lingwala
            </div>
            <div className="absolute bottom-[18%] left-[34%] rounded-full bg-white/80 px-2 py-1 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              Limete
            </div>

            {visiblePoints.map((point) => {
              const pointStatus = statusToTracking(point.status);
              const config = statusConfig[pointStatus];
              const isActive = point.tripId === activeTrip.id;
              return (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => focusTrip(point.tripId)}
                  className={`absolute flex min-h-9 -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-3 py-2 text-xs font-black shadow-lg transition sm:min-h-0 sm:px-2 sm:py-1 ${
                    isActive
                      ? 'scale-110 border-white bg-brand-blue text-white ring-4 ring-brand-blue/20'
                      : `border-white ${config.bg} ${config.text}`
                  }`}
                  style={pointPosition(point)}
                  aria-label={`${point.label} ${config.label}`}
                >
                  <Icon name={pointIcon[point.kind]} className="h-4 w-4" />
                  <span className="hidden sm:inline">{point.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => setGeoAvailable((current) => !current)}
              className="rounded-xl border border-surface-border-subtle px-3 py-3 text-xs font-black text-content-muted hover:bg-surface-muted sm:py-2"
            >
              Basculer fallback géolocalisation
            </button>
            <button
              type="button"
              onClick={refreshTracking}
              className="rounded-xl bg-brand-blue px-3 py-3 text-xs font-black text-white hover:bg-brand-blue-700 sm:py-2"
            >
              Actualiser positions
            </button>
            <span className="rounded-xl bg-surface-muted px-3 py-2 text-xs font-bold text-content-muted">
              {visiblePoints.length} points visibles · dernière synchro {lastSyncAt}
            </span>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <section className={`${logisticsCard} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-content-primary">Mission active</h2>
          <div className="mt-4 rounded-xl bg-surface-muted p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-black text-content-primary">{activeTrip.taskId}</p>
                <p className="mt-1 text-sm text-content-muted">{activeTrip.origin} vers {activeTrip.destination}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-black ${statusConfig[activeTrip.trackingStatus].bg} ${statusConfig[activeTrip.trackingStatus].text}`}>
                {activeTrip.statusLabel}
              </span>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-content-muted">Chauffeur</dt>
                <dd className="font-black text-content-primary">{activeTrip.driverName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-content-muted">Véhicule</dt>
                <dd className="font-black text-content-primary">{activeTrip.vehiclePlate}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-content-muted">ETA</dt>
                <dd className="font-black text-content-primary">{activeTrip.etaMinutes} min</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-content-muted">Distance</dt>
                <dd className="font-black text-content-primary">{activeTrip.distanceKm} km</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className={`${logisticsCard} p-4 sm:p-5`}>
          <div className="flex items-center gap-2">
            <Icon name="document-text" className="h-5 w-5 text-brand-blue" />
            <h2 className="text-lg font-black text-content-primary">Détail trajet</h2>
          </div>
          <div className="mt-4 rounded-xl bg-surface-muted p-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-content-muted">Origine</dt>
                <dd className="font-black text-content-primary">{activeTrip.origin}</dd>
              </div>
              <div>
                <dt className="text-content-muted">Destination</dt>
                <dd className="font-black text-content-primary">{activeTrip.destination}</dd>
              </div>
              <div>
                <dt className="text-content-muted">Distance</dt>
                <dd className="font-black text-content-primary">{activeTrip.distanceKm} km</dd>
              </div>
              <div>
                <dt className="text-content-muted">Durée estimée</dt>
                <dd className="font-black text-content-primary">{activeTrip.estimatedDurationMinutes} min</dd>
              </div>
              <div>
                <dt className="text-content-muted">Client</dt>
                <dd className="font-black text-content-primary">{activeTrip.customerName}</dd>
              </div>
              <div>
                <dt className="text-content-muted">Statut</dt>
                <dd className="font-black text-content-primary">{tripStatusLabels[activeTrip.status]}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-black text-content-primary">Timeline</h3>
            <ol className="mt-3 space-y-3">
              {activeTimeline.map((event) => (
                <li key={event.id} className="flex gap-3 text-sm">
                  <span className={`mt-1 h-3 w-3 rounded-full ${event.completed ? 'bg-green-500' : 'bg-surface-border-subtle'}`} />
                  <span>
                    <span className="block font-black text-content-primary">{event.title}</span>
                    <span className="text-xs text-content-muted">{event.timestamp}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => updateTripStatus(activeTrip.status === 'delivered' ? 'in_transit' : 'delivered')}
              className="rounded-xl bg-brand-blue px-3 py-3 text-sm font-black text-white sm:py-2 sm:text-xs"
            >
              Update status
            </button>
            <button
              type="button"
              onClick={() => setActionMessage(`Contact chauffeur: ${activeTrip.driverName}`)}
              className="rounded-xl border border-surface-border-subtle px-3 py-3 text-sm font-black text-content-primary hover:bg-surface-muted sm:py-2 sm:text-xs"
            >
              Contacter chauffeur
            </button>
            <button
              type="button"
              onClick={() => setActionMessage(`Contact client: ${activeTrip.customerName}`)}
              className="rounded-xl border border-surface-border-subtle px-3 py-3 text-sm font-black text-content-primary hover:bg-surface-muted sm:py-2 sm:text-xs"
            >
              Contacter client
            </button>
            <button
              type="button"
              onClick={() => updateTripStatus('failed')}
              className="rounded-xl border border-red-200 px-3 py-3 text-sm font-black text-red-600 hover:bg-red-50 sm:py-2 sm:text-xs"
            >
              Signaler incident
            </button>
            <button
              type="button"
              onClick={() => updateTripStatus('delayed')}
              className="rounded-xl border border-orange-200 px-3 py-3 text-sm font-black text-orange-600 hover:bg-orange-50 sm:py-2 sm:text-xs"
            >
              Marquer retard
            </button>
            <a
              href="#trip-details"
              onClick={openTripDetails}
              className="rounded-xl bg-surface-muted px-3 py-3 text-center text-sm font-black text-content-primary hover:bg-surface-page sm:py-2 sm:text-xs"
            >
              Ouvrir Trip Details
            </a>
          </div>

          {actionMessage && (
            <p className="mt-4 rounded-xl bg-brand-blue/10 px-3 py-2 text-sm font-bold text-brand-blue">
              {actionMessage}
            </p>
          )}
        </section>

        <section className={`${logisticsCard} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-content-primary">Missions suivies</h2>
          <div className="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-1 lg:mx-0 lg:block lg:space-y-3 lg:px-0 lg:pb-0">
            {filteredTrips.map((trip) => (
              <button
                key={trip.id}
                type="button"
                onClick={() => focusTrip(trip.id)}
                className={`min-w-[230px] rounded-xl p-4 text-left text-sm transition lg:w-full lg:min-w-0 ${
                  trip.id === activeTrip.id ? 'bg-brand-blue text-white' : 'bg-surface-muted text-content-primary hover:bg-surface-page'
                }`}
              >
                <span className="block font-black">{trip.taskId} · {trip.driverName}</span>
                <span className={trip.id === activeTrip.id ? 'text-white/80' : 'text-content-muted'}>
                  {trip.statusLabel} · ETA {trip.etaMinutes} min · {trip.distanceKm} km
                </span>
              </button>
            ))}
            {filteredTrips.length === 0 && (
              <p className="rounded-xl bg-surface-muted px-4 py-3 text-sm font-bold text-content-muted">
                Aucun trajet dans ce filtre.
              </p>
            )}
          </div>
        </section>

        <section className={`${logisticsCard} p-5`}>
          <h2 className="text-lg font-black text-content-primary">Points mission</h2>
          <div className="mt-4 space-y-3">
            {activePoints.map((point) => (
              <div key={point.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-4 py-3 text-sm">
                <span className="font-black text-content-primary">{point.label}</span>
                <span className="text-xs font-bold text-content-muted">{point.kind}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
};
