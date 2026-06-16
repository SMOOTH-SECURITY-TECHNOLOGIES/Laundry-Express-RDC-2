import React, { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import type { DispatchTask, Driver } from '../../components/logistics/logistics-types';
import { logisticsCard } from './logistics-ui';

interface LogisticsDispatchProps {
  focusMissionId?: string | null;
  focusAlertTitle?: string | null;
  focusType?: string | null;
  focusZone?: string | null;
  onClearFocus?: () => void;
}

const drivers: Driver[] = [
  { id: 'drv-001', name: 'Kabongo M.', phone: '+243810001', status: 'available', zone: 'Gombe', vehicleId: 'veh-001' },
  { id: 'drv-002', name: 'Tshimanga A.', phone: '+243810002', status: 'busy', zone: 'Lingwala', vehicleId: 'veh-002' },
  { id: 'drv-003', name: 'Mutombo P.', phone: '+243810003', status: 'available', zone: 'Limete', vehicleId: 'veh-003' },
  { id: 'drv-004', name: 'Kalonji S.', phone: '+243810004', status: 'available', zone: 'Barumbu', vehicleId: 'veh-004' },
  { id: 'drv-005', name: 'Ngoy L.', phone: '+243810005', status: 'busy', zone: 'Gombe', vehicleId: 'veh-005' },
];

const driverLoad: Record<string, number> = {
  'drv-001': 1,
  'drv-002': 4,
  'drv-003': 0,
  'drv-004': 2,
  'drv-005': 3,
};

const vehicleAvailability: Record<string, { available: boolean; reason?: string }> = {
  'veh-001': { available: true },
  'veh-002': { available: true },
  'veh-003': { available: false, reason: 'véhicule indisponible: maintenance overdue' },
  'veh-004': { available: true },
  'veh-005': { available: true },
};

const initialTasks: DispatchTask[] = [
  {
    id: 'MSN-004',
    orderId: 'LX-2004',
    shipmentId: 'shp-004',
    status: 'pending',
    customerName: 'Mama Jeanne',
    pickupAddress: 'Av. Lumumba 42',
    pickupZone: 'Gombe',
    deliveryZone: 'Lingwala',
    distanceKm: 2.1,
    queueMinutes: 15,
    priority: 'urgent',
  },
  {
    id: 'MSN-011',
    orderId: 'LX-2011',
    shipmentId: 'shp-011',
    status: 'in_transit',
    customerName: 'Patrick L.',
    pickupAddress: 'Boulevard du 30 Juin',
    pickupZone: 'Barumbu',
    deliveryZone: 'Gombe',
    distanceKm: 4.4,
    queueMinutes: 2,
    priority: 'high',
    driverId: 'drv-004',
    driverName: 'Kalonji S.',
    vehicleId: 'veh-004',
    currentDriverLoad: 2,
  },
  {
    id: 'MSN-014',
    orderId: 'LX-2014',
    shipmentId: 'shp-014',
    status: 'assigned',
    customerName: 'Sarah K.',
    pickupAddress: 'Av. Kasavubu 15',
    pickupZone: 'Limete',
    deliveryZone: 'Gombe',
    distanceKm: 6.2,
    queueMinutes: 8,
    priority: 'high',
    driverId: 'drv-003',
    driverName: 'Mutombo P.',
    vehicleId: 'veh-003',
    currentDriverLoad: 0,
  },
  {
    id: 'MSN-018',
    orderId: 'LX-2018',
    shipmentId: 'shp-018',
    status: 'delivered',
    customerName: 'Francois G.',
    pickupAddress: 'Rue Kasa-Vubu 8',
    pickupZone: 'Ngaliema',
    deliveryZone: 'Kinshasa',
    distanceKm: 7.8,
    queueMinutes: 0,
    priority: 'normal',
    driverId: 'drv-001',
    driverName: 'Kabongo M.',
    vehicleId: 'veh-001',
    currentDriverLoad: 1,
  },
  {
    id: 'MSN-019',
    orderId: 'LX-2019',
    shipmentId: 'shp-019',
    status: 'pending',
    customerName: 'Monique V.',
    pickupAddress: 'Av. Sendwe 27',
    pickupZone: 'Limete',
    deliveryZone: 'Kinshasa',
    distanceKm: 3.6,
    queueMinutes: 20,
    priority: 'urgent',
  },
  {
    id: 'MSN-020',
    orderId: 'LX-2020',
    shipmentId: 'shp-020',
    status: 'assigned',
    customerName: 'Grace N.',
    pickupAddress: 'Dépôt Gombe',
    pickupZone: 'Gombe',
    deliveryZone: 'Masina',
    distanceKm: 8.8,
    queueMinutes: 6,
    priority: 'normal',
    driverId: 'drv-005',
    driverName: 'Ngoy L.',
    vehicleId: 'veh-005',
    currentDriverLoad: 3,
  },
];

const columns: { status: DispatchTask['status']; title: string }[] = [
  { status: 'pending', title: 'Nouvelles missions' },
  { status: 'assigned', title: 'Assignées' },
  { status: 'in_transit', title: 'En cours' },
  { status: 'delivered', title: 'Terminées' },
];

const priorityLabel: Record<DispatchTask['priority'], string> = {
  normal: 'Normal',
  high: 'Prioritaire',
  urgent: 'Urgent',
};

const focusMatchesTask = (
  task: DispatchTask,
  focusMissionId?: string | null,
  focusType?: string | null,
  focusZone?: string | null
) => {
  const zoneMatches = !focusZone || task.pickupZone.toLowerCase() === focusZone.toLowerCase();
  if (focusMissionId) return task.id === focusMissionId;
  if (focusType === 'waiting') return task.status === 'pending' && zoneMatches;
  if (focusType === 'late') return task.priority === 'urgent' && zoneMatches;
  return zoneMatches;
};

const scoreDriver = (task: DispatchTask, driver: Driver) => {
  const vehicleStatus = driver.vehicleId ? vehicleAvailability[driver.vehicleId] : null;
  if (vehicleStatus && !vehicleStatus.available) return -1;
  const load = driverLoad[driver.id] ?? 0;
  const zoneScore = driver.zone === task.pickupZone ? 45 : 18;
  const availabilityScore = driver.status === 'available' ? 35 : 8;
  const distancePenalty = Math.min(task.distanceKm * 2, 20);
  const loadPenalty = load * 6;
  return Math.max(0, Math.round(zoneScore + availabilityScore - distancePenalty - loadPenalty));
};

export const LogisticsDispatch: React.FC<LogisticsDispatchProps> = ({
  focusMissionId,
  focusAlertTitle,
  focusType,
  focusZone,
  onClearFocus,
}) => {
  const [tasks, setTasks] = useState<DispatchTask[]>(initialTasks);
  const [matchingTaskId, setMatchingTaskId] = useState<string | null>(null);

  const hasFocus = Boolean(focusMissionId || focusAlertTitle || focusType || focusZone);
  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status !== 'cancelled' && (!hasFocus || focusMatchesTask(task, focusMissionId, focusType, focusZone))
      ),
    [focusMissionId, focusType, focusZone, hasFocus, tasks]
  );
  const urgentTasks = visibleTasks.filter((task) => task.priority === 'urgent' || task.queueMinutes >= 15);
  const waitingByZone = visibleTasks
    .filter((task) => task.status === 'pending')
    .reduce<Record<string, number>>((acc, task) => {
      acc[task.pickupZone] = (acc[task.pickupZone] ?? 0) + 1;
      return acc;
    }, {});

  const assignDriver = (task: DispatchTask, driver: Driver) => {
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status: 'assigned',
              driverId: driver.id,
              driverName: driver.name,
              vehicleId: driver.vehicleId,
              currentDriverLoad: driverLoad[driver.id] ?? 0,
            }
          : item
      )
    );
    setMatchingTaskId(null);
  };

  const prioritizeTask = (taskId: string) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, priority: 'urgent', queueMinutes: Math.max(task.queueMinutes, 15) } : task))
    );
  };

  const cancelTask = (taskId: string) => {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: 'cancelled' } : task)));
  };

  const moveToTransit = (taskId: string) => {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: 'in_transit' } : task)));
  };

  const focusTitle = focusMissionId
    ? `Mission ciblée depuis l’alerte: ${focusMissionId}`
    : `Alerte missions ciblée: ${focusAlertTitle ?? (focusType === 'late' ? 'Retards opérationnels' : 'File d’attente')}`;

  return (
    <div className="space-y-6">
      {hasFocus && (
        <div className="rounded-2xl border border-red-400/60 bg-red-500/10 p-4 text-sm text-content-primary">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-extrabold">{focusTitle}</p>
              <p className="mt-1 text-content-muted">
                {visibleTasks.length > 0
                  ? `Le Dispatch Center est filtré sur ${focusZone ? `la zone ${focusZone}` : 'le contexte de cette alerte'} pour éviter la liste générale.`
                  : 'Aucune mission correspondante trouvée dans les données actuelles.'}
              </p>
              {focusZone && <p className="mt-1 text-xs font-bold text-red-200">Zone ciblée: {focusZone}</p>}
            </div>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('logisticsFocusMissionId');
                onClearFocus?.();
              }}
              className="self-start rounded-xl border border-surface-border-subtle px-3 py-2 text-xs font-bold text-content-primary hover:bg-surface-muted sm:self-center"
            >
              Voir toutes les missions
            </button>
          </div>
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.8fr]">
        <div className={`${logisticsCard} p-5`}>
          <div className="flex items-center gap-2">
            <Icon name="warning" className="h-5 w-5 text-brand-orange" />
            <h2 className="text-lg font-black text-content-primary">Missions urgentes</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {urgentTasks.map((task) => (
              <article key={task.id} className="rounded-xl bg-orange-50 p-4 text-sm dark:bg-orange-950/20">
                <p className="font-black text-content-primary">{task.id} · {task.pickupZone}</p>
                <p className="mt-1 text-content-muted">{task.customerName} attend depuis {task.queueMinutes} min</p>
              </article>
            ))}
          </div>
        </div>
        <div className={`${logisticsCard} p-5`}>
          <div className="flex items-center gap-2">
            <Icon name="list" className="h-5 w-5 text-brand-blue" />
            <h2 className="text-lg font-black text-content-primary">Files d’attente</h2>
          </div>
          <div className="mt-4 space-y-3">
            {Object.entries(waitingByZone).map(([zone, count]) => (
              <div key={zone} className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-3 text-sm">
                <span className="font-bold text-content-primary">{zone}</span>
                <span className="rounded-full bg-brand-blue/10 px-2 py-1 text-xs font-black text-brand-blue">
                  {count} mission{count > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="-mx-1 grid gap-4 sm:mx-0 xl:grid-cols-4">
        {columns.map((column) => {
          const columnTasks = visibleTasks.filter((task) => task.status === column.status);
          return (
            <div key={column.status} className={`${logisticsCard} min-h-[260px] p-3 sm:min-h-[360px] sm:p-4`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-black text-content-primary">{column.title}</h2>
                <span className="rounded-full bg-surface-muted px-2 py-1 text-xs font-black text-content-muted">
                  {columnTasks.length}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {columnTasks.map((task) => {
                  const rankedDrivers = [...drivers]
                    .map((driver) => ({ driver, score: scoreDriver(task, driver) }))
                    .sort((a, b) => b.score - a.score);
                  return (
                    <article key={task.id} className="rounded-xl border border-surface-border-subtle bg-surface-muted p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-content-primary">{task.id}</p>
                          <p className="mt-1 text-xs text-content-muted">{task.customerName} · {task.pickupZone}</p>
                        </div>
                        <span className="rounded-full bg-brand-blue/10 px-2 py-1 text-[10px] font-black text-brand-blue">
                          {priorityLabel[task.priority]}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-content-muted">
                        {task.pickupAddress} vers {task.deliveryZone} · {task.distanceKm} km
                      </p>
                      {task.driverName && (
                        <p className="mt-2 text-xs font-bold text-content-primary">
                          Chauffeur: {task.driverName} · charge {task.currentDriverLoad ?? 0}
                        </p>
                      )}

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        {task.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => setMatchingTaskId(matchingTaskId === task.id ? null : task.id)}
                            className="col-span-2 rounded-lg bg-brand-blue px-3 py-3 text-xs font-bold text-white sm:col-span-1 sm:py-1"
                          >
                            Assigner chauffeur
                          </button>
                        )}
                        {task.status === 'assigned' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setMatchingTaskId(matchingTaskId === task.id ? null : task.id)}
                              className="rounded-lg border border-surface-border-subtle px-3 py-3 text-xs font-bold text-content-primary sm:py-1"
                            >
                              Réassigner
                            </button>
                            <button
                              type="button"
                              onClick={() => moveToTransit(task.id)}
                              className="rounded-lg bg-green-600 px-3 py-3 text-xs font-bold text-white sm:py-1"
                            >
                              Démarrer
                            </button>
                          </>
                        )}
                        {task.status !== 'delivered' && (
                          <>
                            <button
                              type="button"
                              onClick={() => prioritizeTask(task.id)}
                              className="rounded-lg border border-orange-200 px-3 py-3 text-xs font-bold text-brand-orange sm:py-1"
                            >
                              Prioriser
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelTask(task.id)}
                              className="rounded-lg border border-red-200 px-3 py-3 text-xs font-bold text-red-600 sm:py-1"
                            >
                              Annuler
                            </button>
                          </>
                        )}
                      </div>

                      {matchingTaskId === task.id && (
                        <div className="mt-3 space-y-2 rounded-lg bg-surface-card p-2">
                          <p className="text-[11px] font-black uppercase text-content-muted">Matching chauffeur</p>
                          {rankedDrivers.slice(0, 5).map(({ driver, score }) => (
                            <button
                              key={driver.id}
                              type="button"
                              disabled={score < 0}
                              onClick={() => {
                                if (score >= 0) assignDriver(task, driver);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-xs sm:px-2 sm:py-2 ${
                                score < 0 ? 'cursor-not-allowed opacity-60' : 'hover:bg-surface-muted'
                              }`}
                            >
                              <span>
                                <span className="font-black text-content-primary">{driver.name}</span>
                                <span className="block text-content-muted">
                                  {driver.zone} · {driver.status} · charge {driverLoad[driver.id] ?? 0}
                                </span>
                                {score < 0 && (
                                  <span className="block font-bold text-red-600">
                                    Assignation bloquée: {vehicleAvailability[driver.vehicleId ?? '']?.reason}
                                  </span>
                                )}
                              </span>
                              <span className="font-black text-brand-blue">{score < 0 ? 'Bloqué' : score}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
