import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import type { MaintenanceEvent } from '../../components/logistics/logistics-types';
import { getMaintenanceEvents, type DataMode } from '../../services/logistics-api';
import { logisticsCard } from './logistics-ui';

const maintenanceEvents: MaintenanceEvent[] = [
  {
    id: 'mnt-001',
    vehicleId: 'veh-003',
    vehiclePlate: 'KIN-207-MT',
    title: 'Contrôle freinage moto',
    type: 'repair',
    status: 'in_progress',
    dueDate: '2026-06-18',
    cost: 45,
    nextControlAt: '2026-07-18',
    alert: 'vehicle_broken',
    vehicleAvailable: false,
  },
  {
    id: 'mnt-002',
    vehicleId: 'veh-002',
    vehiclePlate: 'KIN-118-VN',
    title: 'Vidange van livraison',
    type: 'preventive',
    status: 'scheduled',
    dueDate: '2026-06-20',
    cost: 120,
    nextControlAt: '2026-09-20',
    vehicleAvailable: true,
  },
  {
    id: 'mnt-003',
    vehicleId: 'veh-001',
    vehiclePlate: 'KIN-042-MT',
    title: 'Inspection pneus',
    type: 'inspection',
    status: 'overdue',
    dueDate: '2026-06-14',
    cost: 35,
    nextControlAt: '2026-07-14',
    alert: 'maintenance_overdue',
    vehicleAvailable: false,
  },
  {
    id: 'mnt-004',
    vehicleId: 'veh-004',
    vehiclePlate: 'KIN-301-CR',
    title: 'Renouvellement assurance',
    type: 'insurance',
    status: 'overdue',
    dueDate: '2026-06-01',
    cost: 210,
    nextControlAt: '2026-12-01',
    alert: 'insurance_expired',
    vehicleAvailable: false,
  },
];

type MaintenanceFilter = 'all' | 'alerts' | 'unavailable' | 'scheduled' | 'overdue' | 'done';

const typeLabel: Record<MaintenanceEvent['type'], string> = {
  insurance: 'Assurance',
  repair: 'Réparation',
  preventive: 'Préventif',
  inspection: 'Inspection',
};

const statusLabel: Record<MaintenanceEvent['status'], string> = {
  scheduled: 'Planifié',
  in_progress: 'En cours',
  done: 'Terminé',
  overdue: 'Overdue',
};

const alertLabel: Record<NonNullable<MaintenanceEvent['alert']>, string> = {
  insurance_expired: 'Assurance expirée',
  vehicle_broken: 'Véhicule en panne',
  maintenance_overdue: 'Maintenance overdue',
};

const statusStyle: Record<MaintenanceEvent['status'], string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-orange-100 text-orange-700',
  done: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

const todayIso = '2026-06-17';

const nextStatus = (status: MaintenanceEvent['status']): MaintenanceEvent['status'] => {
  if (status === 'scheduled') return 'in_progress';
  if (status === 'in_progress' || status === 'overdue') return 'done';
  return 'scheduled';
};

const statusActionLabel: Record<MaintenanceEvent['status'], string> = {
  scheduled: 'Démarrer',
  in_progress: 'Terminer',
  overdue: 'Terminer',
  done: 'Replanifier',
};

const computeAlert = (event: MaintenanceEvent): MaintenanceEvent['alert'] => {
  if (!event.vehicleAvailable && event.type === 'insurance') return 'insurance_expired';
  if (!event.vehicleAvailable && event.type === 'repair') return 'vehicle_broken';
  if (event.status === 'overdue') return 'maintenance_overdue';
  return undefined;
};

const computeAvailability = (event: MaintenanceEvent) =>
  event.status !== 'overdue' && event.status !== 'in_progress' && event.alert !== 'insurance_expired' && event.alert !== 'vehicle_broken';

export const LogisticsMaintenance: React.FC = () => {
  const [events, setEvents] = useState<MaintenanceEvent[]>(maintenanceEvents);
  const [dataMode, setDataMode] = useState<DataMode>('degraded');
  const [selectedEventId, setSelectedEventId] = useState(maintenanceEvents[0].id);
  const [filter, setFilter] = useState<MaintenanceFilter>('all');
  const [query, setQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<string[]>([
    'Maintenance prête: alertes, disponibilité et blocage dispatch synchronisés.',
  ]);

  useEffect(() => {
    let mounted = true;
    getMaintenanceEvents(maintenanceEvents).then((result) => {
      if (!mounted) return;
      const nextEvents = result.data.map((event) => ({ ...event, alert: event.alert ?? computeAlert(event) }));
      setEvents(nextEvents);
      setSelectedEventId(nextEvents[0]?.id ?? '');
      setDataMode(result.mode);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const alerts = events.filter((event) => event.alert);
  const unavailableVehicles = events.filter((event) => !event.vehicleAvailable).length;
  const totalCost = events.reduce((total, event) => total + event.cost, 0);
  const overdueCount = events.filter((event) => event.status === 'overdue').length;
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0];

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesQuery = !normalizedQuery || [
        event.vehiclePlate,
        event.title,
        typeLabel[event.type],
        event.status,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedQuery));

      const matchesFilter =
        filter === 'all' ||
        (filter === 'alerts' && Boolean(event.alert)) ||
        (filter === 'unavailable' && !event.vehicleAvailable) ||
        (filter === 'scheduled' && event.status === 'scheduled') ||
        (filter === 'overdue' && event.status === 'overdue') ||
        (filter === 'done' && event.status === 'done');

      return matchesQuery && matchesFilter;
    });
  }, [events, filter, query]);

  const pushAction = (message: string) => {
    setActionMessage(message);
    setActivityLog((current) => [message, ...current].slice(0, 6));
  };

  const updateEvent = (eventId: string, updater: (event: MaintenanceEvent) => MaintenanceEvent, message: string) => {
    setEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        const updated = updater(event);
        const withAlert = { ...updated, alert: computeAlert(updated) };
        return { ...withAlert, vehicleAvailable: computeAvailability(withAlert) };
      })
    );
    setSelectedEventId(eventId);
    pushAction(message);
  };

  const advanceStatus = (event: MaintenanceEvent) => {
    const status = nextStatus(event.status);
    updateEvent(
      event.id,
      (current) => ({
        ...current,
        status,
        dueDate: status === 'scheduled' ? current.nextControlAt : current.dueDate,
        nextControlAt: status === 'done' ? '2026-09-17' : current.nextControlAt,
        vehicleAvailable: status === 'done' || status === 'scheduled',
      }),
      `${event.vehiclePlate}: ${statusLabel[status]}`
    );
  };

  const blockVehicle = (event: MaintenanceEvent) => {
    updateEvent(
      event.id,
      (current) => ({
        ...current,
        status: current.status === 'done' ? 'in_progress' : current.status,
        vehicleAvailable: false,
        alert: current.type === 'insurance' ? 'insurance_expired' : current.type === 'repair' ? 'vehicle_broken' : 'maintenance_overdue',
      }),
      `${event.vehiclePlate}: assignation bloquée`
    );
  };

  const markAvailable = (event: MaintenanceEvent) => {
    updateEvent(
      event.id,
      (current) => ({
        ...current,
        status: 'done',
        alert: undefined,
        vehicleAvailable: true,
        nextControlAt: '2026-09-17',
      }),
      `${event.vehiclePlate}: véhicule disponible`
    );
  };

  const scheduleControl = () => {
    const nextId = `mnt-${String(events.length + 1).padStart(3, '0')}`;
    const created: MaintenanceEvent = {
      id: nextId,
      vehicleId: `veh-${String(events.length + 1).padStart(3, '0')}`,
      vehiclePlate: `KIN-${String(400 + events.length)}-MT`,
      title: 'Contrôle préventif planifié',
      type: 'preventive',
      status: 'scheduled',
      dueDate: '2026-06-24',
      cost: 60,
      nextControlAt: '2026-09-24',
      vehicleAvailable: true,
    };
    setEvents((current) => [created, ...current]);
    setSelectedEventId(created.id);
    pushAction(`${created.vehiclePlate}: contrôle planifié`);
  };

  const filters: Array<{ key: MaintenanceFilter; label: string; count: number }> = [
    { key: 'all', label: 'Tous', count: events.length },
    { key: 'alerts', label: 'Alertes', count: alerts.length },
    { key: 'unavailable', label: 'Indisponibles', count: unavailableVehicles },
    { key: 'scheduled', label: 'Planifiés', count: events.filter((event) => event.status === 'scheduled').length },
    { key: 'overdue', label: 'Overdue', count: overdueCount },
    { key: 'done', label: 'Terminés', count: events.filter((event) => event.status === 'done').length },
  ];

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
        dataMode === 'backend'
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-orange-200 bg-orange-50 text-orange-700'
      }`}>
        {dataMode === 'backend' ? 'Données maintenance connectées au backend' : 'Mode dégradé — données maintenance locales'}
      </div>

      {actionMessage && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          {actionMessage}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Entretiens suivis', events.length],
          ['Alertes maintenance', alerts.length],
          ['Véhicules indisponibles', unavailableVehicles],
          ['Coût maintenance', `${totalCost} $`],
        ].map(([label, value]) => (
          <article key={label} className={`${logisticsCard} p-4`}>
            <p className="text-xs font-bold uppercase text-content-muted">{label}</p>
            <p className="mt-2 text-2xl font-black text-content-primary">{value}</p>
          </article>
        ))}
      </section>

      <section className={`${logisticsCard} p-5`}>
        <div className="flex items-center gap-2">
          <Icon name="warning" className="h-5 w-5 text-brand-orange" />
          <h2 className="text-lg font-black text-content-primary">Alertes maintenance</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {alerts.map((event) => (
            <article key={event.id} className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900/50 dark:bg-red-950/20">
              <p className="font-black text-red-700 dark:text-red-200">{alertLabel[event.alert!]}</p>
              <p className="mt-1 text-content-primary">{event.vehiclePlate} · {event.title}</p>
              <p className="mt-2 text-xs font-bold text-red-700 dark:text-red-200">
                Assignation bloquée tant que le véhicule est indisponible.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className={`${logisticsCard} overflow-hidden`}>
          <div className="flex flex-col gap-4 border-b border-surface-border-subtle p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Icon name="settings" className="h-5 w-5 text-brand-blue" />
                <h2 className="text-lg font-black text-content-primary">Suivi entretien véhicules</h2>
              </div>
              <p className="mt-1 text-sm text-content-muted">Planification, blocage dispatch et remise en disponibilité.</p>
            </div>
            <button
              type="button"
              onClick={scheduleControl}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-black text-white hover:bg-brand-blue-700"
            >
              <Icon name="plus" className="h-4 w-4" />
              Planifier contrôle
            </button>
          </div>

          <div className="space-y-3 border-b border-surface-border-subtle p-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-black ${
                    filter === item.key
                      ? 'bg-brand-blue text-white'
                      : 'bg-surface-muted text-content-muted hover:bg-brand-blue/10 hover:text-brand-blue'
                  }`}
                >
                  {item.label} <span className="ml-1 rounded-full bg-white/20 px-1.5">{item.count}</span>
                </button>
              ))}
            </div>
            <label className="relative block">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-surface-border-subtle bg-surface-card pl-9 pr-3 text-sm text-content-primary"
                placeholder="Rechercher véhicule, entretien, statut..."
              />
            </label>
          </div>

          <div className="grid gap-3 p-4 lg:hidden">
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                className={`rounded-2xl border p-4 ${selectedEvent?.id === event.id ? 'border-brand-blue bg-brand-blue/5' : 'border-surface-border-subtle bg-surface-card'}`}
              >
                <button type="button" onClick={() => setSelectedEventId(event.id)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-content-primary">{event.vehiclePlate}</p>
                      <p className="mt-1 text-xs text-content-muted">{event.title}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${statusStyle[event.status]}`}>
                      {statusLabel[event.status]}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-content-muted">
                    <span>{typeLabel[event.type]}</span>
                    <span>{event.cost} $</span>
                    <span>{event.dueDate}</span>
                    <span>{event.vehicleAvailable ? 'Disponible' : 'Indisponible'}</span>
                  </div>
                </button>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => advanceStatus(event)} className="rounded-lg border border-surface-border-subtle px-3 py-2 text-xs font-bold text-brand-blue">{statusActionLabel[event.status]}</button>
                  <button type="button" onClick={() => blockVehicle(event)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Bloquer assignation</button>
                  <button type="button" onClick={() => markAvailable(event)} className="rounded-lg border border-green-200 px-3 py-2 text-xs font-bold text-green-700">Rendre disponible</button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-[1120px] w-full text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase text-content-muted">
                <tr>
                  <th className="px-5 py-3">Véhicule</th>
                  <th className="px-5 py-3">Type entretien</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Coût</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Prochain contrôle</th>
                  <th className="px-5 py-3">Disponibilité</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border-subtle">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className={selectedEvent?.id === event.id ? 'bg-brand-blue/5' : undefined}>
                    <td className="px-5 py-4">
                      <button type="button" onClick={() => setSelectedEventId(event.id)} className="text-left">
                        <p className="font-black text-content-primary hover:text-brand-blue">{event.vehiclePlate}</p>
                        <p className="text-xs text-content-muted">{event.title}</p>
                      </button>
                    </td>
                    <td className="px-5 py-4 text-content-muted">{typeLabel[event.type]}</td>
                    <td className="px-5 py-4 text-content-muted">{event.dueDate}</td>
                    <td className="px-5 py-4 text-content-muted">{event.cost} $</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2 py-1 text-xs font-black ${statusStyle[event.status]}`}>
                        {statusLabel[event.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-content-muted">{event.nextControlAt}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2 py-1 text-xs font-black ${event.vehicleAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {event.vehicleAvailable ? 'Disponible' : 'Indisponible'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => advanceStatus(event)} className="rounded-lg border border-surface-border-subtle px-2 py-1 text-xs font-bold text-brand-blue hover:bg-brand-blue/10">{statusActionLabel[event.status]}</button>
                        <button type="button" onClick={() => blockVehicle(event)} className="rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">Bloquer assignation</button>
                        <button type="button" onClick={() => markAvailable(event)} className="rounded-lg border border-green-200 px-2 py-1 text-xs font-bold text-green-700 hover:bg-green-50">Rendre disponible</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedEvent && (
          <aside className="space-y-6">
            <section className={`${logisticsCard} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-content-muted">Dossier maintenance</p>
                  <h3 className="mt-1 text-xl font-black text-content-primary">{selectedEvent.vehiclePlate}</h3>
                  <p className="mt-1 text-sm text-content-muted">{selectedEvent.title}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-black ${selectedEvent.vehicleAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedEvent.vehicleAvailable ? 'Disponible' : 'Bloqué'}
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  ['Type', typeLabel[selectedEvent.type]],
                  ['Statut', statusLabel[selectedEvent.status]],
                  ['Date', selectedEvent.dueDate],
                  ['Coût estimé', `${selectedEvent.cost} $`],
                  ['Prochain contrôle', selectedEvent.nextControlAt],
                  ['Décision dispatch', selectedEvent.vehicleAvailable ? 'Assignation autorisée' : 'Assignation bloquée'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2">
                    <span className="text-content-muted">{label}</span>
                    <span className="text-right font-black text-content-primary">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-2">
                <button type="button" onClick={() => advanceStatus(selectedEvent)} className="rounded-xl bg-brand-blue px-3 py-3 text-sm font-black text-white hover:bg-brand-blue-700">
                  {statusActionLabel[selectedEvent.status]}
                </button>
                <button type="button" onClick={() => blockVehicle(selectedEvent)} className="rounded-xl border border-red-200 px-3 py-3 text-sm font-black text-red-600 hover:bg-red-50">
                  Bloquer assignation
                </button>
                <button type="button" onClick={() => markAvailable(selectedEvent)} className="rounded-xl border border-green-200 px-3 py-3 text-sm font-black text-green-700 hover:bg-green-50">
                  Rendre disponible
                </button>
              </div>
            </section>

            <section className={`${logisticsCard} p-5`}>
              <h2 className="text-lg font-black text-content-primary">Journal maintenance</h2>
              <div className="mt-4 space-y-2">
                {activityLog.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-xl bg-surface-muted px-3 py-2 text-xs font-bold text-content-muted">
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-xl border border-surface-border-subtle px-3 py-2 text-xs font-bold text-content-muted">
                Date opérationnelle: {todayIso}
              </p>
            </section>
          </aside>
        )}
      </section>
    </div>
  );
};
