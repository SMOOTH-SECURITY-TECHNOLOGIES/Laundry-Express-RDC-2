import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import type { LogisticsStatus, Trip, TripTimelineEvent } from '../../components/logistics/logistics-types';
import { getTrips, type DataMode } from '../../services/logistics-api';
import { logisticsCard } from './logistics-ui';

interface DetailedTrip extends Trip {
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

const fallbackTrips: DetailedTrip[] = [
  {
    id: 'trip-001',
    taskId: 'MSN-004',
    status: 'delayed',
    origin: 'Gombe',
    destination: 'Lingwala',
    distanceKm: 3.4,
    etaMinutes: 18,
    estimatedDurationMinutes: 32,
    customerName: 'Mama Jeanne',
    driverName: 'Tshimanga A.',
    vehiclePlate: 'KIN-042-MT',
    clientPhone: '+243 812 345 901',
    driverPhone: '+243 810 002',
    pickupAddress: 'Av. Lumumba 42, Gombe',
    deliveryAddress: 'Avenue Kalembelembe, Lingwala',
    createdAt: '10:02',
    assignedAt: '10:05',
    pickupAt: '10:12',
    inTransitAt: '10:15',
  },
  {
    id: 'trip-002',
    taskId: 'MSN-014',
    status: 'in_transit',
    origin: 'Limete',
    destination: 'Gombe',
    distanceKm: 6.1,
    etaMinutes: 24,
    estimatedDurationMinutes: 41,
    customerName: 'Sarah K.',
    driverName: 'Mutombo P.',
    vehiclePlate: 'KIN-118-VN',
    clientPhone: '+243 812 345 902',
    driverPhone: '+243 810 003',
    pickupAddress: 'Av. Kasavubu 15, Limete',
    deliveryAddress: 'Boulevard du 30 Juin, Gombe',
    createdAt: '09:58',
    assignedAt: '10:04',
    pickupAt: '10:10',
    inTransitAt: '10:18',
  },
  {
    id: 'trip-003',
    taskId: 'MSN-021',
    status: 'assigned',
    origin: 'Barumbu',
    destination: 'Gombe',
    distanceKm: 2.2,
    etaMinutes: 12,
    estimatedDurationMinutes: 22,
    customerName: 'David M.',
    driverName: 'Kalonji S.',
    vehiclePlate: 'KIN-207-MT',
    clientPhone: '+243 812 345 903',
    driverPhone: '+243 810 004',
    pickupAddress: 'Rue Itaga, Barumbu',
    deliveryAddress: 'Av. Tombalbaye, Gombe',
    createdAt: '10:08',
    assignedAt: '10:11',
  },
];

const statusLabel: Record<LogisticsStatus, string> = {
  pending: 'En attente',
  assigned: 'Assigné',
  in_transit: 'En route',
  delivered: 'Livré',
  delayed: 'Retard',
  failed: 'Incident',
  cancelled: 'Annulé',
};

const statusTone: Record<LogisticsStatus, string> = {
  pending: 'bg-slate-100 text-slate-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  delayed: 'bg-orange-100 text-orange-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-200 text-slate-700',
};

const mapTrip = (trip: Trip): DetailedTrip => ({
  ...trip,
  customerName: trip.customerName || 'Client Laundry',
  driverName: trip.driverName || 'Chauffeur à assigner',
  vehiclePlate: trip.vehiclePlate || 'Véhicule à confirmer',
  clientPhone: '+243 812 345 900',
  driverPhone: '+243 810 000',
  pickupAddress: trip.origin,
  deliveryAddress: trip.destination,
  estimatedDurationMinutes: trip.estimatedDurationMinutes ?? 30,
  etaMinutes: trip.etaMinutes ?? 15,
  distanceKm: trip.distanceKm ?? 0,
  createdAt: 'Maintenant',
});

const timelineForTrip = (trip: DetailedTrip): TripTimelineEvent[] => {
  const completedLabels: TripTimelineEvent['label'][] = ['created'];
  if (['assigned', 'in_transit', 'delayed', 'delivered'].includes(trip.status)) completedLabels.push('assigned');
  if (['in_transit', 'delayed', 'delivered'].includes(trip.status)) completedLabels.push('pickup', 'in_transit');
  if (trip.status === 'delivered') completedLabels.push('delivered');

  return [
    { id: `${trip.id}-created`, tripId: trip.id, label: 'created', title: 'Créé', timestamp: trip.createdAt, completed: completedLabels.includes('created') },
    { id: `${trip.id}-assigned`, tripId: trip.id, label: 'assigned', title: 'Assigné', timestamp: trip.assignedAt || 'À venir', completed: completedLabels.includes('assigned') },
    { id: `${trip.id}-pickup`, tripId: trip.id, label: 'pickup', title: 'Ramassage', timestamp: trip.pickupAt || 'À venir', completed: completedLabels.includes('pickup') },
    { id: `${trip.id}-transit`, tripId: trip.id, label: 'in_transit', title: 'En route', timestamp: trip.inTransitAt || 'À venir', completed: completedLabels.includes('in_transit') },
    { id: `${trip.id}-delivered`, tripId: trip.id, label: 'delivered', title: 'Livré', timestamp: trip.deliveredAt || `ETA ${trip.etaMinutes} min`, completed: completedLabels.includes('delivered') },
  ];
};

export const LogisticsTripDetails: React.FC = () => {
  const [trips, setTrips] = useState<DetailedTrip[]>(fallbackTrips);
  const [selectedTripId, setSelectedTripId] = useState(fallbackTrips[0].id);
  const [dataMode, setDataMode] = useState<DataMode>('degraded');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<string[]>(['Trip Details prêt: statut, contacts et incident tracking disponibles.']);

  useEffect(() => {
    let mounted = true;
    getTrips(fallbackTrips).then((result) => {
      if (!mounted) return;
      const nextTrips = result.data.map(mapTrip);
      setTrips(nextTrips);
      setSelectedTripId(nextTrips[0]?.id ?? '');
      setDataMode(result.mode);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) ?? trips[0];
  const timeline = useMemo(() => selectedTrip ? timelineForTrip(selectedTrip) : [], [selectedTrip]);

  const pushAction = (message: string) => {
    setActionMessage(message);
    setActivityLog((current) => [message, ...current].slice(0, 5));
  };

  const updateStatus = (status: LogisticsStatus) => {
    if (!selectedTrip) return;
    setTrips((current) =>
      current.map((trip) =>
        trip.id === selectedTrip.id
          ? {
              ...trip,
              status,
              deliveredAt: status === 'delivered' ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : trip.deliveredAt,
              inTransitAt: status === 'in_transit' ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : trip.inTransitAt,
            }
          : trip
      )
    );
    pushAction(`Statut mis à jour: ${statusLabel[status]}`);
  };

  if (!selectedTrip) {
    return (
      <section className={`${logisticsCard} p-6`}>
        <h2 className="text-lg font-black text-content-primary">Trip Details</h2>
        <p className="mt-2 text-sm text-content-muted">Aucun trajet disponible.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-6">
        <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
          dataMode === 'backend'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-orange-200 bg-orange-50 text-orange-700'
        }`}>
          {dataMode === 'backend' ? 'Trip Details connecté au backend' : 'Mode dégradé — détails trajet locaux'}
        </div>

        {actionMessage && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
            {actionMessage}
          </div>
        )}

        <section className={`${logisticsCard} overflow-hidden`}>
          <div className="flex flex-col gap-4 border-b border-surface-border-subtle p-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Icon name="document-text" className="h-5 w-5 text-brand-blue" />
                <h2 className="text-lg font-black text-content-primary">Trip Details</h2>
              </div>
              <p className="mt-1 text-sm text-content-muted">Origine, destination, chauffeur, véhicule, client et statut du trajet.</p>
            </div>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${statusTone[selectedTrip.status]}`}>
              {statusLabel[selectedTrip.status]}
            </span>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-3">
            <div className="rounded-2xl bg-surface-muted p-5 lg:col-span-2">
              <p className="text-xs font-bold uppercase text-content-muted">Trajet actif</p>
              <h3 className="mt-2 text-2xl font-black text-content-primary">{selectedTrip.taskId}</h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ['Origine', selectedTrip.pickupAddress],
                  ['Destination', selectedTrip.deliveryAddress],
                  ['Distance', `${selectedTrip.distanceKm} km`],
                  ['Durée estimée', `${selectedTrip.estimatedDurationMinutes} min`],
                  ['ETA', `${selectedTrip.etaMinutes} min`],
                  ['Statut', statusLabel[selectedTrip.status]],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-surface-card px-4 py-3">
                    <p className="text-xs font-bold text-content-muted">{label}</p>
                    <p className="mt-1 text-sm font-black text-content-primary">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl bg-surface-muted p-4">
                <p className="text-xs font-bold uppercase text-content-muted">Chauffeur</p>
                <p className="mt-2 text-lg font-black text-content-primary">{selectedTrip.driverName}</p>
                <p className="text-sm text-content-muted">{selectedTrip.driverPhone}</p>
                <p className="mt-2 text-sm font-bold text-content-primary">{selectedTrip.vehiclePlate}</p>
              </div>
              <div className="rounded-2xl bg-surface-muted p-4">
                <p className="text-xs font-bold uppercase text-content-muted">Client</p>
                <p className="mt-2 text-lg font-black text-content-primary">{selectedTrip.customerName}</p>
                <p className="text-sm text-content-muted">{selectedTrip.clientPhone}</p>
              </div>
            </div>
          </div>
        </section>

        <section className={`${logisticsCard} p-5`}>
          <div className="flex items-center gap-2">
            <Icon name="clock-history" className="h-5 w-5 text-brand-blue" />
            <h2 className="text-lg font-black text-content-primary">Timeline trajet</h2>
          </div>
          <ol className="mt-5 grid gap-4 md:grid-cols-5">
            {timeline.map((event) => (
              <li key={event.id} className="relative rounded-2xl bg-surface-muted p-4">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  event.completed ? 'bg-green-600 text-white' : 'bg-surface-card text-content-muted'
                }`}>
                  <Icon name={event.completed ? 'check' : 'clock'} className="h-4 w-4" />
                </span>
                <p className="mt-3 text-sm font-black text-content-primary">{event.title}</p>
                <p className="mt-1 text-xs text-content-muted">{event.timestamp}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={`${logisticsCard} p-5`}>
          <div className="flex items-center gap-2">
            <Icon name="settings" className="h-5 w-5 text-brand-blue" />
            <h2 className="text-lg font-black text-content-primary">Actions trajet</h2>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <button type="button" onClick={() => updateStatus(selectedTrip.status === 'delivered' ? 'in_transit' : 'delivered')} className="rounded-xl bg-brand-blue px-4 py-3 text-sm font-black text-white hover:bg-brand-blue-700">
              Update status
            </button>
            <button type="button" onClick={() => pushAction(`Contact chauffeur: ${selectedTrip.driverName}`)} className="rounded-xl border border-surface-border-subtle px-4 py-3 text-sm font-black text-content-primary hover:bg-surface-muted">
              Contacter chauffeur
            </button>
            <button type="button" onClick={() => pushAction(`Contact client: ${selectedTrip.customerName}`)} className="rounded-xl border border-surface-border-subtle px-4 py-3 text-sm font-black text-content-primary hover:bg-surface-muted">
              Contacter client
            </button>
            <button type="button" onClick={() => updateStatus('failed')} className="rounded-xl border border-red-200 px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50">
              Signaler incident
            </button>
          </div>
        </section>
      </section>

      <aside className="space-y-6">
        <section className={`${logisticsCard} p-5`}>
          <h2 className="text-lg font-black text-content-primary">Trajets</h2>
          <div className="mt-4 space-y-3">
            {trips.map((trip) => (
              <button
                key={trip.id}
                type="button"
                onClick={() => setSelectedTripId(trip.id)}
                className={`w-full rounded-2xl p-4 text-left text-sm ${
                  trip.id === selectedTrip.id ? 'bg-brand-blue text-white' : 'bg-surface-muted text-content-primary hover:bg-surface-page'
                }`}
              >
                <span className="block font-black">{trip.taskId} · {trip.customerName}</span>
                <span className={trip.id === selectedTrip.id ? 'text-white/80' : 'text-content-muted'}>
                  {trip.origin} vers {trip.destination} · {statusLabel[trip.status]}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className={`${logisticsCard} p-5`}>
          <h2 className="text-lg font-black text-content-primary">Journal actions</h2>
          <div className="mt-4 space-y-2">
            {activityLog.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-xl bg-surface-muted px-3 py-2 text-xs font-bold text-content-muted">
                {item}
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
};
