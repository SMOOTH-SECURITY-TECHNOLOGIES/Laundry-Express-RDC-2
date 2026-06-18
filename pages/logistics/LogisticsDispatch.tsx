import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import type { DispatchTask, Driver } from '../../components/logistics/logistics-types';
import { getDispatchTasks, mergeFocusedBacklogIntoDispatchTasks, type DataMode } from '../../services/logistics-api';
import { realApi } from '../../services/real-api';
import { logisticsCard } from './logistics-ui';
import { DispatcherMobileDashboard } from '../../components/dispatcher/DispatcherMobileDashboard';
import { CARD, TYPO, SPACING } from '../../components/ui/tokens';
import { pilotTrackAssignment, pilotTrackCancellation, pilotTrackMissionStart } from '../../lib/pilot-metrics-store';

interface LogisticsDispatchProps {
  focusMissionId?: string | null;
  focusAlertTitle?: string | null;
  focusType?: string | null;
  focusZone?: string | null;
  onClearFocus?: () => void;
}

type DispatchMobileFilter = 'all' | 'urgent' | 'pending' | 'assigned' | 'in_transit';

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

const statusLabel: Record<DispatchTask['status'], string> = {
  pending: 'Nouvelle',
  assigned: 'Assignée',
  in_transit: 'En cours',
  delivered: 'Terminée',
  delayed: 'Retard',
  failed: 'Échec',
  cancelled: 'Annulée',
};

const priorityLabel: Record<DispatchTask['priority'], string> = {
  normal: 'Normal',
  high: 'Prioritaire',
  urgent: 'Urgent',
};

const mobileFilterLabel: Record<DispatchMobileFilter, string> = {
  all: 'Toutes',
  urgent: 'Urgentes',
  pending: 'Nouvelles',
  assigned: 'Assignées',
  in_transit: 'En cours',
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

const mapDispatchMissionStatus = (status: DispatchTask['status']) => {
  if (status === 'assigned') return 'accepted';
  if (status === 'in_transit') return 'in_progress';
  if (status === 'delivered') return 'completed';
  return status;
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
  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialTasks[0]?.id ?? '');
  const [dataMode, setDataMode] = useState<DataMode>('degraded');
  const [mobileFilter, setMobileFilter] = useState<DispatchMobileFilter>('urgent');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [operationLog, setOperationLog] = useState<string[]>([
    'Dispatch Center prêt: matching zone, disponibilité, distance et charge chauffeur.',
  ]);

  useEffect(() => {
    let mounted = true;
    const focusId = focusMissionId ?? sessionStorage.getItem('logisticsFocusMissionId');
    getDispatchTasks(initialTasks).then((result) => {
      if (!mounted) return;
      const mergedTasks = mergeFocusedBacklogIntoDispatchTasks(result.data, focusId);
      setTasks(mergedTasks);
      const selectedId =
        focusId && mergedTasks.some((task) => task.id === focusId)
          ? focusId
          : mergedTasks[0]?.id ?? '';
      setSelectedTaskId(selectedId);
      if (focusId && mergedTasks.some((task) => task.id === focusId)) {
        setMatchingTaskId(focusId);
      }
      setDataMode(result.mode);
      if (focusId && mergedTasks.some((task) => task.id === focusId) && !result.data.some((task) => task.id === focusId)) {
        setOperationLog((current) => [`${focusId} chargée depuis le backlog missions.`, ...current].slice(0, 6));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!focusMissionId) return;
    setTasks((current) => {
      const merged = mergeFocusedBacklogIntoDispatchTasks(current, focusMissionId);
      return merged.length === current.length ? current : merged;
    });
    setSelectedTaskId(focusMissionId);
    setMatchingTaskId(focusMissionId);
  }, [focusMissionId]);

  const hasFocus = Boolean(focusMissionId || focusAlertTitle || focusType || focusZone);
  const isBacklogDispatch = Boolean(focusMissionId && !focusAlertTitle && !focusType && !focusZone);
  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status !== 'cancelled' && (!hasFocus || focusMatchesTask(task, focusMissionId, focusType, focusZone))
      ),
    [focusMissionId, focusType, focusZone, hasFocus, tasks]
  );
  const hasFocusedMission = visibleTasks.length > 0;
  const urgentTasks = visibleTasks.filter((task) => task.priority === 'urgent' || task.queueMinutes >= 15);
  const mobileQueue = useMemo(() => {
    const filtered = visibleTasks.filter((task) => {
      if (mobileFilter === 'all') return task.status !== 'delivered';
      if (mobileFilter === 'urgent') return task.priority === 'urgent' || task.queueMinutes >= 15 || task.status === 'delayed';
      return task.status === mobileFilter;
    });
    return [...filtered].sort((a, b) => {
      const priorityScore = { urgent: 3, high: 2, normal: 1 };
      return priorityScore[b.priority] - priorityScore[a.priority] || b.queueMinutes - a.queueMinutes;
    });
  }, [mobileFilter, visibleTasks]);
  const mobileFilterCounts: Record<DispatchMobileFilter, number> = {
    all: visibleTasks.filter((task) => task.status !== 'delivered').length,
    urgent: urgentTasks.length,
    pending: visibleTasks.filter((task) => task.status === 'pending').length,
    assigned: visibleTasks.filter((task) => task.status === 'assigned').length,
    in_transit: visibleTasks.filter((task) => task.status === 'in_transit').length,
  };
  const waitingByZone = visibleTasks
    .filter((task) => task.status === 'pending')
    .reduce<Record<string, number>>((acc, task) => {
      acc[task.pickupZone] = (acc[task.pickupZone] ?? 0) + 1;
      return acc;
    }, {});

  const selectedTaskCandidate = tasks.find((task) => task.id === selectedTaskId);
  const selectedTask =
    selectedTaskCandidate && selectedTaskCandidate.status !== 'cancelled'
      ? selectedTaskCandidate
      : visibleTasks[0] ?? tasks.find((task) => task.status !== 'cancelled');

  const pushLog = (message: string) => {
    setOperationLog((current) => [message, ...current].slice(0, 6));
    setActionMessage(message);
  };

  const assignDriver = async (task: DispatchTask, driver: Driver) => {
    const vehicleStatus = driver.vehicleId ? vehicleAvailability[driver.vehicleId] : null;
    if (vehicleStatus && !vehicleStatus.available) {
      pushLog(`Assignation bloquée: ${vehicleStatus.reason}`);
      setMatchingTaskId(task.id);
      setSelectedTaskId(task.id);
      return;
    }

    setIsSavingAction(true);
    if (dataMode === 'backend') {
      try {
        if (task.taskStatus === 'open_market') {
          await realApi.claimLogisticsTask(task.shipmentId || task.id);
        }
        await realApi.assignLogisticsTask(task.shipmentId || task.id, driver.id);
      } catch (error) {
        pushLog(`Backend indisponible, action conservée localement: ${error instanceof Error ? error.message : 'assignation'}`);
      }
    }

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
    setSelectedTaskId(task.id);
    pilotTrackMissionStart(task.id);
    pilotTrackAssignment(task.id);
    pushLog(`${task.id} assignée à ${driver.name}.`);
    setIsSavingAction(false);
  };

  const prioritizeTask = (taskId: string) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, priority: 'urgent', queueMinutes: Math.max(task.queueMinutes, 15) } : task))
    );
    setSelectedTaskId(taskId);
    pushLog(`${taskId} priorisée en urgence.`);
  };

  const cancelTask = async (taskId: string) => {
    setIsSavingAction(true);
    if (dataMode === 'backend') {
      const task = tasks.find((item) => item.id === taskId);
      try {
        await realApi.cancelLogisticsTask(task?.shipmentId || taskId, 'Annulé depuis Dispatch Center');
      } catch (error) {
        pushLog(`Backend indisponible, annulation conservée localement: ${error instanceof Error ? error.message : 'annulation'}`);
      }
    }
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: 'cancelled' } : task)));
    const nextVisibleTask = tasks.find((task) => task.id !== taskId && task.status !== 'cancelled');
    setSelectedTaskId(nextVisibleTask?.id ?? '');
    pilotTrackCancellation(taskId);
    pushLog(`${taskId} annulée et retirée du tableau dispatch.`);
    setIsSavingAction(false);
  };

  const moveToTransit = async (taskId: string) => {
    setIsSavingAction(true);
    if (dataMode === 'backend') {
      const task = tasks.find((item) => item.id === taskId);
      try {
        await realApi.startLogisticsTask(task?.shipmentId || taskId);
      } catch (error) {
        pushLog(`Backend indisponible, démarrage conservé localement: ${error instanceof Error ? error.message : 'démarrage'}`);
      }
    }
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: 'in_transit' } : task)));
    setSelectedTaskId(taskId);
    pushLog(`${taskId} démarrée et déplacée en cours.`);
    setIsSavingAction(false);
  };

  const completeTask = async (taskId: string) => {
    setIsSavingAction(true);
    if (dataMode === 'backend') {
      const task = tasks.find((item) => item.id === taskId);
      try {
        await realApi.completeLogisticsTask(task?.shipmentId || taskId, 'Terminée depuis Dispatch Center');
      } catch (error) {
        pushLog(`Backend indisponible, clôture conservée localement: ${error instanceof Error ? error.message : 'clôture'}`);
      }
    }
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: 'delivered' } : task)));
    setSelectedTaskId(taskId);
    pushLog(`${taskId} terminée.`);
    setIsSavingAction(false);
  };

  const openTracking = (task: DispatchTask) => {
    sessionStorage.setItem('logisticsFocusMissionId', task.id);
    sessionStorage.setItem('logisticsFocusTripId', task.shipmentId);
    window.location.hash = 'tracking';
  };

  const focusTitle = focusMissionId
    ? isBacklogDispatch
      ? `Mission depuis le backlog: ${focusMissionId}`
      : `Mission ciblée depuis l’alerte: ${focusMissionId}`
    : `Alerte missions ciblée: ${focusAlertTitle ?? (focusType === 'late' ? 'Retards opérationnels' : 'File d’attente')}`;

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
        dataMode === 'backend'
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-orange-200 bg-orange-50 text-orange-700'
      }`}>
        {dataMode === 'backend' ? 'Données dispatch connectées au backend' : 'Mode dégradé — données dispatch partielles'}
      </div>

      {hasFocus && (
        <div
          className={`rounded-2xl border p-4 text-sm text-content-primary ${
            isBacklogDispatch && hasFocusedMission
              ? 'border-brand-blue/40 bg-brand-blue/10'
              : hasFocusedMission
                ? 'border-amber-400/60 bg-amber-500/10'
                : 'border-red-400/60 bg-red-500/10'
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-extrabold">{focusTitle}</p>
              <p className="mt-1 text-content-muted">
                {hasFocusedMission
                  ? isBacklogDispatch
                    ? `La mission ${focusMissionId} est prête pour assignation chauffeur dans la file ci-dessous.`
                    : `Le Dispatch Center est filtré sur ${focusZone ? `la zone ${focusZone}` : 'le contexte de cette alerte'} pour éviter la liste générale.`
                  : 'Aucune mission correspondante trouvée dans les données actuelles.'}
              </p>
              {focusZone && <p className="mt-1 text-xs font-bold text-red-700 dark:text-red-200">Zone ciblée: {focusZone}</p>}
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

      {actionMessage && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          {actionMessage}
        </div>
      )}

      <section className="hidden xl:grid gap-4 lg:grid-cols-[1.3fr_0.8fr] xl:grid-cols-[1.1fr_0.7fr_0.8fr]">
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
        <div className={`${logisticsCard} p-5`}>
          <div className="flex items-center gap-2">
            <Icon name="sparkles" className="h-5 w-5 text-brand-blue" />
            <h2 className="text-lg font-black text-content-primary">Mission active</h2>
          </div>
          {selectedTask ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl bg-surface-muted p-4">
                <p className="font-black text-content-primary">{selectedTask.id} · {selectedTask.customerName}</p>
                <p className="mt-1 text-content-muted">{selectedTask.pickupZone} vers {selectedTask.deliveryZone}</p>
              </div>
              {[
                ['Statut', statusLabel[selectedTask.status]],
                ['Priorité', priorityLabel[selectedTask.priority]],
                ['Chauffeur', selectedTask.driverName ?? 'Non assigné'],
                ['Distance', `${selectedTask.distanceKm} km`],
                ['Attente', `${selectedTask.queueMinutes} min`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2">
                  <span className="text-content-muted">{label}</span>
                  <span className="font-black text-content-primary">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-content-muted">Aucune mission sélectionnée.</p>
          )}
        </div>
      </section>

      <section className="hidden xl:block">
        <div className={`${logisticsCard} p-5`}>
          <div className="flex items-center gap-2">
            <Icon name="clock-history" className="h-5 w-5 text-brand-blue" />
            <h2 className="text-lg font-black text-content-primary">Journal dispatch</h2>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {operationLog.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-xl bg-surface-muted px-3 py-2 text-xs font-bold text-content-muted">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="xl:hidden">
        <DispatcherMobileDashboard
          missions={visibleTasks.map((task) => ({
            id: task.id,
            orderRef: task.orderId,
            status: mapDispatchMissionStatus(task.status),
            statusLabel: statusLabel[task.status],
            priority: task.priority,
            clientName: task.customerName,
            pickupZone: task.pickupZone,
            deliveryZone: task.deliveryZone,
            distance: `${task.distanceKm} km`,
            eta: `${task.queueMinutes} min`,
            queueMinutes: task.queueMinutes,
            driverName: task.driverName,
          }))}
          drivers={drivers.map((driver) => ({
            id: driver.id,
            name: driver.name,
            zone: driver.zone,
            status: driver.status === 'available' ? 'available' as const : 'busy' as const,
            score: 0,
            load: driverLoad[driver.id] ?? 0,
            vehicleAvailable: vehicleAvailability[driver.vehicleId]?.available ?? true,
          }))}
          resolveDriverScore={(missionId, driverCandidate) => {
            const task = tasks.find((item) => item.id === missionId);
            const driver = drivers.find((item) => item.id === driverCandidate.id);
            if (task && driver) return scoreDriver(task, driver);
            return driverCandidate.score;
          }}
          stats={{
            total: tasks.length,
            urgent: tasks.filter((task) => task.priority === 'urgent').length,
            pending: tasks.filter((task) => task.status === 'pending').length,
            active: tasks.filter((task) => task.status === 'assigned' || task.status === 'in_transit').length,
          }}
          onSelectMission={setSelectedTaskId}
          onAssignDriver={(missionId, driverId) => {
            const task = tasks.find((item) => item.id === missionId);
            const driver = drivers.find((item) => item.id === driverId);
            if (task && driver) assignDriver(task, driver);
          }}
          onStartMission={moveToTransit}
          onCompleteMission={completeTask}
          onPrioritize={prioritizeTask}
          onCancel={cancelTask}
          onRefresh={() => {
            getDispatchTasks(initialTasks).then((result) => {
              const merged = mergeFocusedBacklogIntoDispatchTasks(result.data, focusMissionId);
              setTasks(merged);
              setDataMode(result.mode);
              pushLog('File dispatch actualisée.');
            });
          }}
          onOpenTracking={(missionId) => {
            const task = tasks.find((item) => item.id === missionId);
            if (task) openTracking(task);
          }}
          isSaving={isSavingAction}
        />
      </section>

      <section className="-mx-1 hidden gap-4 sm:mx-0 xl:grid xl:grid-cols-4">
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
                    <article key={task.id} className={`rounded-xl border p-3 ${
                      selectedTaskId === task.id
                        ? 'border-brand-blue bg-brand-blue/5'
                        : 'border-surface-border-subtle bg-surface-muted'
                    }`}>
                      <button type="button" onClick={() => setSelectedTaskId(task.id)} className="w-full text-left">
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
                      </button>
                      {task.driverName && (
                        <p className="mt-2 text-xs font-bold text-content-primary">
                          Chauffeur: {task.driverName} · charge {task.currentDriverLoad ?? 0}
                        </p>
                      )}

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        {task.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTaskId(task.id);
                              setMatchingTaskId(matchingTaskId === task.id ? null : task.id);
                            }}
                            className="col-span-2 rounded-lg bg-brand-blue px-3 py-3 text-xs font-bold text-white sm:col-span-1 sm:py-1"
                          >
                            Assigner chauffeur
                          </button>
                        )}
                        {task.status === 'assigned' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTaskId(task.id);
                                setMatchingTaskId(matchingTaskId === task.id ? null : task.id);
                              }}
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
                        {task.status === 'in_transit' && (
                          <button
                            type="button"
                            onClick={() => completeTask(task.id)}
                            className="rounded-lg bg-green-600 px-3 py-3 text-xs font-bold text-white sm:py-1"
                          >
                            Terminer
                          </button>
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
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-black uppercase text-content-muted">Matching chauffeur</p>
                            {isSavingAction && <span className="text-[11px] font-bold text-brand-blue">Sauvegarde...</span>}
                          </div>
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
