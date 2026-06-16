import React from 'react';
import { Icon } from '../../components/Icon';
import type { TrackingPoint, Trip } from '../../components/logistics/logistics-types';
import { logisticsCard } from './logistics-ui';

const trips: Trip[] = [
  {
    id: 'trip-001',
    taskId: 'MSN-004',
    status: 'delayed',
    origin: 'Gombe',
    destination: 'Lingwala',
    etaMinutes: 18,
    distanceKm: 3.4,
  },
  {
    id: 'trip-002',
    taskId: 'MSN-014',
    status: 'in_transit',
    origin: 'Limete',
    destination: 'Gombe',
    etaMinutes: 24,
    distanceKm: 6.1,
  },
];

const trackingPoints: TrackingPoint[] = [
  {
    id: 'pt-001',
    tripId: 'trip-001',
    latitude: -4.319,
    longitude: 15.306,
    recordedAt: '2026-06-16T10:15:00.000Z',
    status: 'delayed',
  },
  {
    id: 'pt-002',
    tripId: 'trip-002',
    latitude: -4.354,
    longitude: 15.342,
    recordedAt: '2026-06-16T10:18:00.000Z',
    status: 'in_transit',
  },
];

export const LogisticsTracking: React.FC = () => (
  <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
    <section className={`${logisticsCard} min-h-[420px] p-5`}>
      <div className="flex items-center gap-2">
        <Icon name="map" className="h-5 w-5 text-brand-blue" />
        <h2 className="text-lg font-black text-content-primary">Live Tracking</h2>
      </div>
      <div className="mt-5 flex min-h-[330px] items-center justify-center rounded-xl border border-dashed border-surface-border-subtle bg-surface-muted text-center">
        <div>
          <Icon name="mapPin" className="mx-auto h-10 w-10 text-brand-blue" />
          <p className="mt-3 font-black text-content-primary">Carte live tracking prête pour intégration</p>
          <p className="mt-1 text-sm text-content-muted">
            {trackingPoints.length} points normalisés disponibles pour brancher la carte temps réel.
          </p>
        </div>
      </div>
    </section>
    <section className={`${logisticsCard} p-5`}>
      <h2 className="text-lg font-black text-content-primary">Trips actifs</h2>
      <div className="mt-4 space-y-3">
        {trips.map((trip) => (
          <article key={trip.id} className="rounded-xl bg-surface-muted p-4">
            <p className="text-sm font-black text-content-primary">{trip.taskId}</p>
            <p className="mt-1 text-sm text-content-muted">
              {trip.origin} vers {trip.destination}
            </p>
            <p className="mt-3 text-xs font-bold text-brand-blue">
              ETA {trip.etaMinutes} min · {trip.distanceKm} km
            </p>
          </article>
        ))}
      </div>
    </section>
  </div>
);
