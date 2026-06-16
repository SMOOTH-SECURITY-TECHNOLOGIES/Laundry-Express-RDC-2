import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import type { LogisticsStatus, TrackingPoint, Trip } from '../../components/logistics/logistics-types';
import { logisticsCard } from './logistics-ui';

type TrackingStatus = 'available' | 'busy' | 'delayed' | 'offline';

interface LiveTrip extends Trip {
  driverName: string;
  vehiclePlate: string;
  statusLabel: string;
  trackingStatus: TrackingStatus;
}

const liveTrips: LiveTrip[] = [
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
    driverName: 'Ngoy L.',
    vehiclePlate: 'KIN-301-CR',
  },
];

const trackingPoints: TrackingPoint[] = [
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

export const LogisticsTracking: React.FC = () => {
  const [activeTripId, setActiveTripId] = useState('trip-001');
  const [geoAvailable, setGeoAvailable] = useState(() => typeof navigator !== 'undefined' && 'geolocation' in navigator);

  const activeTrip = liveTrips.find((trip) => trip.id === activeTripId) ?? liveTrips[0];
  const activePoints = useMemo(
    () => trackingPoints.filter((point) => point.tripId === activeTrip.id),
    [activeTrip.id]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
      <section className={`${logisticsCard} overflow-hidden`}>
        <div className="flex flex-col gap-4 border-b border-surface-border-subtle p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="map" className="h-5 w-5 text-brand-blue" />
              <h2 className="text-lg font-black text-content-primary">Live Tracking</h2>
            </div>
            <p className="mt-1 text-sm text-content-muted">Véhicules, chauffeurs, missions et points pickup/delivery.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusConfig).map(([status, config]) => (
              <span key={status} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${config.bg} ${config.text}`}>
                <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                {config.label}
              </span>
            ))}
          </div>
        </div>

        {!geoAvailable && (
          <div className="mx-5 mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-200">
            Géolocalisation indisponible. Affichage fallback sur les dernières positions connues.
          </div>
        )}

        <div className="p-5">
          <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-surface-border-subtle bg-slate-100 dark:bg-slate-900">
            <div className="absolute inset-0 opacity-70">
              <div className="absolute left-[12%] top-[18%] h-[68%] w-[2px] rotate-[24deg] bg-white/70 dark:bg-white/10" />
              <div className="absolute left-[28%] top-[10%] h-[82%] w-[2px] -rotate-[18deg] bg-white/70 dark:bg-white/10" />
              <div className="absolute left-[8%] top-[44%] h-[2px] w-[84%] bg-white/70 dark:bg-white/10" />
              <div className="absolute left-[18%] top-[64%] h-[2px] w-[68%] rotate-[-10deg] bg-white/70 dark:bg-white/10" />
            </div>

            <div className="absolute left-[8%] top-[12%] rounded-full bg-white/80 px-2 py-1 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              Gombe
            </div>
            <div className="absolute right-[12%] top-[28%] rounded-full bg-white/80 px-2 py-1 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              Lingwala
            </div>
            <div className="absolute bottom-[18%] left-[34%] rounded-full bg-white/80 px-2 py-1 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              Limete
            </div>

            {trackingPoints.map((point) => {
              const pointStatus = statusToTracking(point.status);
              const config = statusConfig[pointStatus];
              const isActive = point.tripId === activeTrip.id;
              return (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => setActiveTripId(point.tripId)}
                  className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-2 py-1 text-xs font-black shadow-lg transition ${
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
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGeoAvailable((current) => !current)}
              className="rounded-xl border border-surface-border-subtle px-3 py-2 text-xs font-black text-content-muted hover:bg-surface-muted"
            >
              Basculer fallback géolocalisation
            </button>
            <span className="rounded-xl bg-surface-muted px-3 py-2 text-xs font-bold text-content-muted">
              {trackingPoints.length} points live · dernière synchro 10:19
            </span>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <section className={`${logisticsCard} p-5`}>
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

        <section className={`${logisticsCard} p-5`}>
          <h2 className="text-lg font-black text-content-primary">Missions suivies</h2>
          <div className="mt-4 space-y-3">
            {liveTrips.map((trip) => (
              <button
                key={trip.id}
                type="button"
                onClick={() => setActiveTripId(trip.id)}
                className={`w-full rounded-xl p-4 text-left text-sm transition ${
                  trip.id === activeTrip.id ? 'bg-brand-blue text-white' : 'bg-surface-muted text-content-primary hover:bg-surface-page'
                }`}
              >
                <span className="block font-black">{trip.taskId} · {trip.driverName}</span>
                <span className={trip.id === activeTrip.id ? 'text-white/80' : 'text-content-muted'}>
                  {trip.statusLabel} · ETA {trip.etaMinutes} min · {trip.distanceKm} km
                </span>
              </button>
            ))}
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
