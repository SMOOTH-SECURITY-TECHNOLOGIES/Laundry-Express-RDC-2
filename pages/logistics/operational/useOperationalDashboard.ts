import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  realApi,
  type AdminSupportTicket,
  type BackendActivityLogDashboardResponse,
  type BackendCampaignDashboardResponse,
  type BackendLoyaltyDashboardResponse,
  type BackendReviewsDashboardResponse,
  type LogisticsDriver,
  type LogisticsMaintenanceEvent,
  type LogisticsTask,
  type LogisticsTrackingPoint,
  type LogisticsVehicle,
  type Order,
} from '../../../services/real-api';
import { backlogItemsFromLogisticsTasks } from '../../../lib/logistics/backlog-model';
import type { DispatchBacklogItem } from '../../../lib/logistics/backlog-model';
import type { DataMode } from '../../../services/logistics-api';
import type { useRealTimeAlerts } from '../../../hooks/useRealTimeAlerts';
import { buildOperationalDecisions, buildCapacitySummary, type OperationalDecision, type CapacitySummary } from './operational-decisions';
import {
  isWithinPeriod,
  minutesAgoLabel,
  percentOf,
  periodDays,
  statusIn,
  toCorridorHealth,
  type CorridorHealthStatus,
  type PeriodKey,
} from './operational-utils';

export type SourceSyncStatus = {
  synced: number;
  pending: number;
  total: number;
  label: string;
};

export type OperationalModel = {
  openTasks: LogisticsTask[];
  activeTasks: LogisticsTask[];
  completedTasks: LogisticsTask[];
  failedTasks: LogisticsTask[];
  backlogItems: DispatchBacklogItem[];
  completionRate: number;
  onTimeRate: number;
  behaviorScore: number;
  activeDrivers: LogisticsDriver[];
  availableDrivers: LogisticsDriver[];
  lastClosedMissionAgo: string | null;
  fieldActivity: Array<{ hour: string; count: number }>;
  priorityMissions: LogisticsTask[];
  topZones: Array<{ zone: string; missions: number; success: number; pressure: number }>;
  readyDrivers: Array<{ id: string; name: string; vehicle: string; zone: string; score: number }>;
  corridorPipeline: Array<{ label: string; value: number | null; context: string }>;
  health: Array<{ label: string; status: CorridorHealthStatus; detail: string; unavailable?: boolean }>;
  activitySignals: Array<{ label: string; detail: string; ago: string }>;
  networkPulse: string;
  decisions: OperationalDecision[];
  capacitySummary: CapacitySummary;
  mapZones: Array<{ zone: string; missions: number; success: number; pressure: number }>;
  openTicketsCount: number;
  fleet: {
    available: number;
    inMission: number;
    maintenance: number;
    outOfService: number;
    total: number;
    overdueMaintenance: number;
    blockingMaintenance: number;
    readinessRate: number;
  };
  operationalExceptions: Array<{
    id: string;
    type: string;
    reference: string;
    commune: string;
    impact: string;
    severity: 'critical' | 'warning' | 'info';
    target: 'dispatch' | 'maintenance' | 'reports' | 'alerts';
    missionId?: string;
    zone?: string;
  }>;
  capabilities: Array<{
    id: string;
    label: string;
    status: 'active' | 'partial' | 'connect' | 'unavailable';
    source: string;
    confidence: 'high' | 'medium' | 'low';
    nextAction: string;
  }>;
  gpsHealth: {
    status: 'active' | 'partial' | 'connect';
    livePoints: number;
    stalePoints: number;
    coverageRate: number;
    lastSignalAgo: string;
    fallbackZones: number;
    confidence: 'high' | 'medium' | 'low';
    recommendation: string;
  };
  driverBehavior: {
    status: 'active' | 'partial' | 'connect';
    scoredDrivers: number;
    totalDrivers: number;
    averageScore: number;
    completedMissions: number;
    incidents: number;
    cancellations: number;
    punctualityRate: number;
    confidence: 'high' | 'medium' | 'low';
    recommendation: string;
  };
};

const latestByDate = <T,>(items: T[], pickDate: (item: T) => string | null | undefined): T | undefined =>
  [...items]
    .filter((item) => pickDate(item))
    .sort((a, b) => (new Date(pickDate(b) || 0).getTime() || 0) - (new Date(pickDate(a) || 0).getTime() || 0))[0];

export function useOperationalDashboard(
  tasks: LogisticsTask[],
  drivers: LogisticsDriver[],
  period: PeriodKey,
  includeAdminInsights = false,
) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<LogisticsVehicle[]>([]);
  const [maintenance, setMaintenance] = useState<LogisticsMaintenanceEvent[]>([]);
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [activity, setActivity] = useState<BackendActivityLogDashboardResponse['events']>([]);
  const [reviewsDashboard, setReviewsDashboard] = useState<BackendReviewsDashboardResponse | null>(null);
  const [loyaltyDashboard, setLoyaltyDashboard] = useState<BackendLoyaltyDashboardResponse | null>(null);
  const [campaignDashboard, setCampaignDashboard] = useState<BackendCampaignDashboardResponse | null>(null);
  const [reviewsAvailable, setReviewsAvailable] = useState(true);
  const [loyaltyAvailable, setLoyaltyAvailable] = useState(true);
  const [campaignsAvailable, setCampaignsAvailable] = useState(true);
  const [loadingSources, setLoadingSources] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SourceSyncStatus>({
    synced: 0,
    pending: 0,
    total: 5,
    label: 'Réseau connecté',
  });
  const [driverPositions, setDriverPositions] = useState<Array<
    Pick<LogisticsTrackingPoint, 'id' | 'kind' | 'label' | 'recordedAt' | 'status' | 'driverName' | 'vehiclePlate'> & {
      lat: number;
      lng: number;
    }
  >>([]);

  const loadSources = useCallback(async () => {
    setLoadingSources(true);
    let synced = 0;
    let pending = 0;
    const days = periodDays(period);
    const coreResults = await Promise.allSettled([
      realApi.getOrders({ page: 1, page_size: 100 }),
      realApi.getVehicles(),
      realApi.getMaintenanceEvents(),
      realApi.getSupportTickets(),
      realApi.getTrackingPoints(),
    ]);

    const [
      ordersResult,
      vehiclesResult,
      maintenanceResult,
      ticketsResult,
      trackingResult,
    ] = coreResults;

    const track = (result: PromiseSettledResult<unknown>) => {
      if (result.status === 'fulfilled') synced += 1;
      else pending += 1;
    };

    if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value.orders || []);
    track(ordersResult);
    if (vehiclesResult.status === 'fulfilled') setVehicles(vehiclesResult.value.vehicles || []);
    track(vehiclesResult);
    if (maintenanceResult.status === 'fulfilled') setMaintenance(maintenanceResult.value.maintenance_events || []);
    track(maintenanceResult);
    if (ticketsResult.status === 'fulfilled') setTickets(ticketsResult.value || []);
    track(ticketsResult);

    if (includeAdminInsights) {
      const adminResults = await Promise.allSettled([
        realApi.getActivityLogDashboard(20),
        realApi.getReviewsDashboard(days),
        realApi.getLoyaltyDashboard(days),
        realApi.getCampaignDashboard(days),
      ]);
      const [activityResult, reviewsResult, loyaltyResult, campaignsResult] = adminResults;

      if (activityResult.status === 'fulfilled') {
        setActivity(activityResult.value.live_events?.length ? activityResult.value.live_events : activityResult.value.events || []);
      }
      track(activityResult);
      if (reviewsResult.status === 'fulfilled') {
        setReviewsDashboard(reviewsResult.value);
        setReviewsAvailable(true);
      } else {
        setReviewsDashboard(null);
        setReviewsAvailable(false);
      }
      track(reviewsResult);
      if (loyaltyResult.status === 'fulfilled') {
        setLoyaltyDashboard(loyaltyResult.value);
        setLoyaltyAvailable(true);
      } else {
        setLoyaltyDashboard(null);
        setLoyaltyAvailable(false);
      }
      track(loyaltyResult);
      if (campaignsResult.status === 'fulfilled') {
        setCampaignDashboard(campaignsResult.value);
        setCampaignsAvailable(true);
      } else {
        setCampaignDashboard(null);
        setCampaignsAvailable(false);
      }
      track(campaignsResult);
    } else {
      setActivity([]);
      setReviewsDashboard(null);
      setReviewsAvailable(false);
      setLoyaltyDashboard(null);
      setLoyaltyAvailable(false);
      setCampaignDashboard(null);
      setCampaignsAvailable(false);
    }

    if (trackingResult.status === 'fulfilled') {
      const points = (trackingResult.value.tracking_points || [])
        .map((point) => ({
          id: point.id,
          kind: point.kind,
          label: point.label,
          lat: Number(point.latitude),
          lng: Number(point.longitude),
          recordedAt: point.recordedAt,
          status: point.status,
          driverName: point.driverName,
          vehiclePlate: point.vehiclePlate,
        }))
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
      setDriverPositions(points);
    } else {
      setDriverPositions([]);
    }
    track(trackingResult);

    setSyncStatus({
      synced,
      pending,
      total: synced + pending,
      label:
        pending === 0
          ? `Réseau connecté · ${synced} source${synced > 1 ? 's' : ''} synchronisée${synced > 1 ? 's' : ''}`
          : `Réseau connecté · ${synced} source${synced > 1 ? 's' : ''} synchronisée${synced > 1 ? 's' : ''} · ${pending} en attente`,
    });
    setLoadingSources(false);
  }, [includeAdminInsights, period]);

  useEffect(() => {
    void loadSources();
    const timer = window.setInterval(() => void loadSources(), 30_000);
    return () => window.clearInterval(timer);
  }, [loadSources]);

  const model = useMemo((): OperationalModel => {
    const periodTasks = tasks.filter(
      (task) =>
        isWithinPeriod(task.created_at, period) ||
        isWithinPeriod(task.updated_at, period) ||
        isWithinPeriod(task.completed_at, period),
    );
    const periodOrders = orders.filter((order) => isWithinPeriod(order.created_at, period));
    const openTasks = periodTasks.filter((task) => statusIn(task.status, ['pending', 'open_market']));
    const activeTasks = periodTasks.filter((task) =>
      statusIn(task.status, ['claimed', 'driver_assigned', 'accepted', 'in_progress']),
    );
    const completedTasks = periodTasks.filter((task) => task.status === 'completed');
    const failedTasks = periodTasks.filter((task) => statusIn(task.status, ['failed', 'cancelled', 'expired']));
    const pickupTasks = periodTasks.filter((task) => task.task_type === 'pickup');
    const deliveryTasks = periodTasks.filter((task) => task.task_type === 'delivery');
    const pickupDone = pickupTasks.filter((task) =>
      statusIn(task.status, ['completed', 'in_progress', 'accepted', 'driver_assigned']),
    );
    const deliveryDone = deliveryTasks.filter((task) => task.status === 'completed');
    const paidOrders = periodOrders.filter((order) =>
      statusIn(order.payment_status, ['paid', 'confirmed', 'completed', 'validated', 'succeeded']),
    );
    const activeDrivers = drivers.filter((driver) => driver.status === 'active');
    const availableDrivers = activeDrivers.filter((driver) => driver.is_available);
    const openTickets = tickets.filter((ticket) => !statusIn(ticket.status, ['closed', 'resolved']));
    const activeMaintenance = maintenance.filter((event) => statusIn(event.status, ['scheduled', 'in_progress', 'overdue']));
    const overdueMaintenance = maintenance.filter((event) => event.status === 'overdue');
    const blockingMaintenance = maintenance.filter((event) => event.status === 'overdue' || event.vehicleAvailable === false);
    const unavailableVehicleIds = new Set(blockingMaintenance.map((event) => event.vehicleId));
    const fleetAvailable = vehicles.filter(
      (vehicle) =>
        statusIn(vehicle.status, ['pending', 'assigned', 'delivered']) &&
        vehicle.maintenance.status === 'ok' &&
        !unavailableVehicleIds.has(vehicle.id),
    );
    const fleetInMission = vehicles.filter((vehicle) => vehicle.status === 'in_transit');
    const fleetOutOfService = vehicles.filter(
      (vehicle) =>
        statusIn(vehicle.status, ['failed', 'cancelled']) ||
        vehicle.maintenance.status === 'overdue' ||
        unavailableVehicleIds.has(vehicle.id),
    );
    const fleet = {
      available: fleetAvailable.length,
      inMission: fleetInMission.length,
      maintenance: activeMaintenance.length,
      outOfService: fleetOutOfService.length,
      total: vehicles.length,
      overdueMaintenance: overdueMaintenance.length,
      blockingMaintenance: blockingMaintenance.length,
      readinessRate: percentOf(fleetAvailable.length + fleetInMission.length, vehicles.length),
    };
    const completionRate = percentOf(deliveryDone.length || completedTasks.length, periodOrders.length);
    const onTimeRate = percentOf(completedTasks.length, completedTasks.length + failedTasks.length);
    const behaviorScore = activeDrivers.length
      ? Math.round(
          activeDrivers.reduce(
            (sum, driver) => sum + Math.min(100, Math.max(0, Math.round(Number(driver.rating_avg) * 20))),
            0,
          ) / activeDrivers.length,
        )
      : 0;

    const zoneMap = periodTasks.reduce((map, task) => {
      const zone = task.pickup_commune || task.delivery_commune || 'Zone inconnue';
      const current = map.get(zone) || { total: 0, completed: 0, active: 0 };
      current.total += 1;
      if (task.status === 'completed') current.completed += 1;
      if (!statusIn(task.status, ['completed', 'cancelled', 'failed', 'expired'])) current.active += 1;
      map.set(zone, current);
      return map;
    }, new Map<string, { total: number; completed: number; active: number }>());

    const topZones = Array.from(zoneMap.entries())
      .map(([zone, value]) => ({
        zone,
        missions: value.total,
        success: percentOf(value.completed, value.total),
        pressure: value.active,
      }))
      .sort((a, b) => b.missions - a.missions)
      .slice(0, 5);

    const hourMap = periodTasks.reduce((map, task) => {
      const date = new Date(task.created_at);
      if (Number.isNaN(date.getTime())) return map;
      const hour = `${String(date.getHours()).padStart(2, '0')}h`;
      map.set(hour, (map.get(hour) || 0) + 1);
      return map;
    }, new Map<string, number>());
    const fieldActivity = Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    const priorityMissions = periodTasks
      .filter((task) => !statusIn(task.status, ['completed', 'cancelled']))
      .sort((a, b) => {
        const rank = (task: LogisticsTask) =>
          statusIn(task.status, ['failed', 'expired']) ? 0 : statusIn(task.status, ['pending', 'open_market']) ? 1 : 2;
        return rank(a) - rank(b);
      })
      .slice(0, 5);

    const lastCompletedTask = latestByDate(
      tasks.filter((task) => task.status === 'completed'),
      (task) => task.completed_at,
    );
    const lastCompletedInPeriod = latestByDate(
      completedTasks,
      (task) => task.completed_at,
    );
    const lastOrderAny = latestByDate(orders, (order) => order.created_at);
    const lastOrderInPeriod = latestByDate(periodOrders, (order) => order.created_at);
    const allPaidOrders = orders.filter((order) =>
      statusIn(order.payment_status, ['paid', 'confirmed', 'completed', 'validated', 'succeeded']),
    );
    const lastPaidAny = latestByDate(allPaidOrders, (order) => order.updated_at || order.created_at);
    const lastPaidInPeriod = latestByDate(paidOrders, (order) => order.updated_at || order.created_at);
    const allPickupDone = tasks.filter(
      (task) => task.task_type === 'pickup' && statusIn(task.status, ['completed', 'in_progress', 'accepted', 'driver_assigned']),
    );
    const lastPickupAny = latestByDate(allPickupDone, (task) => task.completed_at || task.updated_at);
    const lastPickupInPeriod = latestByDate(pickupDone, (task) => task.completed_at || task.updated_at);
    const allDeliveryDone = tasks.filter((task) => task.task_type === 'delivery' && task.status === 'completed');
    const lastDeliveryAny = latestByDate(allDeliveryDone, (task) => task.completed_at);
    const lastDeliveryInPeriod = latestByDate(deliveryDone, (task) => task.completed_at);

    const paymentSuccessRate = percentOf(paidOrders.length, periodOrders.length);
    const paymentSuccessAllTime = percentOf(allPaidOrders.length, orders.length);
    const publishedReviews = reviewsDashboard?.kpis.total_reviews ?? 0;

    const periodLabel = period === 'today' ? "aujourd'hui" : period === 'week' ? 'cette semaine' : 'ce mois';

    const corridorContext = (periodCount: number, latestInPeriod: unknown, latestAny: unknown, pickAgo: (item: unknown) => string | null | undefined, idle: string) => {
      if (periodCount > 0) return `${periodCount} ${periodLabel}`;
      const ago = latestAny ? pickAgo(latestAny) : null;
      if (ago) return `Dernière activité ${ago}`;
      return idle;
    };

    const corridorPipeline = [
      {
        label: 'Commandes créées',
        value: periodOrders.length,
        context: corridorContext(
          periodOrders.length,
          lastOrderInPeriod,
          lastOrderAny,
          (o) => minutesAgoLabel((o as Order).created_at),
          'Réseau prêt · en attente de commandes',
        ),
      },
      {
        label: 'Paiements validés',
        value: paidOrders.length,
        context:
          paidOrders.length > 0
            ? `${paymentSuccessRate}% succès ${periodLabel}`
            : lastPaidAny
              ? `Dernier paiement ${minutesAgoLabel(lastPaidAny.updated_at || lastPaidAny.created_at)}`
              : 'Aucun paiement récent enregistré',
      },
      {
        label: 'Collectes effectuées',
        value: pickupDone.length,
        context: corridorContext(
          pickupDone.length,
          lastPickupInPeriod,
          lastPickupAny,
          (t) => minutesAgoLabel((t as LogisticsTask).completed_at || (t as LogisticsTask).updated_at),
          'Aucune collecte sur la période',
        ),
      },
      {
        label: 'Livraisons réalisées',
        value: deliveryDone.length || completedTasks.length,
        context: corridorContext(
          deliveryDone.length || completedTasks.length,
          lastDeliveryInPeriod || lastCompletedInPeriod,
          lastDeliveryAny || lastCompletedTask,
          (t) => minutesAgoLabel((t as LogisticsTask).completed_at),
          'Aucune livraison clôturée sur la période',
        ),
      },
      {
        label: 'Avis publiés',
        value: reviewsAvailable ? publishedReviews : null,
        context: reviewsAvailable
          ? publishedReviews > 0
            ? `${publishedReviews} avis sur la période`
            : 'Aucun nouvel avis · satisfaction suivie'
          : 'Module avis en attente de données',
      },
    ];

    const activitySignals = [
      lastCompletedTask?.completed_at
        ? {
            label: 'Mission clôturée',
            detail: lastCompletedTask.order_number || lastCompletedTask.id,
            ago: minutesAgoLabel(lastCompletedTask.completed_at) || 'récemment',
          }
        : null,
      lastPaidAny
        ? {
            label: 'Paiement validé',
            detail: lastPaidAny.order_number || `Commande ${String(lastPaidAny.id).slice(0, 8)}`,
            ago: minutesAgoLabel(lastPaidAny.updated_at || lastPaidAny.created_at) || 'récemment',
          }
        : null,
      lastPickupAny
        ? {
            label: 'Collecte effectuée',
            detail: lastPickupAny.order_number || lastPickupAny.pickup_commune || 'Terrain',
            ago: minutesAgoLabel(lastPickupAny.completed_at || lastPickupAny.updated_at) || 'récemment',
          }
        : null,
      openTasks.length > 0
        ? {
            label: 'File dispatch',
            detail: `${openTasks.length} mission(s) à assigner`,
            ago: 'maintenant',
          }
        : null,
      availableDrivers.length > 0
        ? {
            label: 'Chauffeurs disponibles',
            detail: `${availableDrivers.length} prêt(s) sur le réseau`,
            ago: 'live',
          }
        : null,
    ].filter((item): item is { label: string; detail: string; ago: string } => Boolean(item));

    const networkPulse =
      periodOrders.length === 0 && openTasks.length === 0 && activeTasks.length === 0
        ? lastCompletedTask?.completed_at
          ? `Réseau connecté · dernière mission clôturée ${minutesAgoLabel(lastCompletedTask.completed_at)}`
          : drivers.length > 0
            ? `Réseau connecté · ${availableDrivers.length} chauffeur(s) disponible(s)`
            : 'Réseau connecté · file d’attente vide'
        : `${openTasks.length} en attente · ${activeTasks.length} en cours · ${periodOrders.length} commande(s) ${periodLabel}`;

    const decisions = buildOperationalDecisions(tasks, drivers, orders, tickets, {
      openCount: openTasks.length,
      activeCount: activeTasks.length,
      fieldActivity,
    });
    const capacitySummary = buildCapacitySummary(
      availableDrivers.length,
      activeTasks.length,
      openTasks.length,
      fieldActivity,
    );
    const hasTrackingPoints = driverPositions.length > 0;
    const now = Date.now();
    const gpsLivePoints = driverPositions.filter((point) => {
      const recordedAt = new Date(point.recordedAt).getTime();
      if (!Number.isFinite(recordedAt)) return false;
      return now - recordedAt <= 15 * 60_000;
    });
    const gpsStalePoints = driverPositions.filter((point) => {
      const recordedAt = new Date(point.recordedAt).getTime();
      return !Number.isFinite(recordedAt) || now - recordedAt > 15 * 60_000;
    });
    const trackedDriverNames = new Set(
      driverPositions
        .map((point) => point.driverName)
        .filter((name): name is string => Boolean(name)),
    );
    const gpsCoverageRate = percentOf(
      trackedDriverNames.size || gpsLivePoints.length,
      activeDrivers.length || driverPositions.length,
    );
    const latestGpsPoint = latestByDate(driverPositions, (point) => point.recordedAt);
    const gpsHealth: OperationalModel['gpsHealth'] = {
      status: hasTrackingPoints ? (gpsStalePoints.length > 0 ? 'partial' : 'active') : 'connect',
      livePoints: gpsLivePoints.length,
      stalePoints: gpsStalePoints.length,
      coverageRate: gpsCoverageRate,
      lastSignalAgo: latestGpsPoint ? minutesAgoLabel(latestGpsPoint.recordedAt) || 'récemment' : 'aucun signal',
      fallbackZones: topZones.length,
      confidence: hasTrackingPoints && gpsCoverageRate >= 70 ? 'high' : hasTrackingPoints ? 'medium' : 'low',
      recommendation: hasTrackingPoints
        ? gpsStalePoints.length > 0
          ? 'Relancer les chauffeurs sans position récente.'
          : 'Ajouter précision GPS et alertes de signal faible.'
        : 'Activer le ping GPS chauffeur et conserver le fallback zones.',
    };
    const behaviorReadyDrivers = activeDrivers.filter((driver) => Number(driver.rating_count || 0) > 0);
    const driverTaskIds = new Set(activeDrivers.map((driver) => driver.id));
    const completedDriverMissions = completedTasks.filter((task) => task.driver_id && driverTaskIds.has(task.driver_id));
    const cancelledDriverMissions = failedTasks.filter((task) => task.driver_id && driverTaskIds.has(task.driver_id));
    const behaviorIncidentCount =
      cancelledDriverMissions.length +
      openTickets.filter((ticket) => ticket.priority === 'high' || ticket.priority === 'urgent' || ticket.priority === 'critical').length;
    const behaviorAverageScore = behaviorReadyDrivers.length
      ? Math.round(
          behaviorReadyDrivers.reduce(
            (sum, driver) => sum + Math.min(100, Math.max(0, Math.round(Number(driver.rating_avg) * 20))),
            0,
          ) / behaviorReadyDrivers.length,
        )
      : 0;
    const driverBehavior: OperationalModel['driverBehavior'] = {
      status: behaviorReadyDrivers.length > 0 ? (completedDriverMissions.length > 0 ? 'active' : 'partial') : 'connect',
      scoredDrivers: behaviorReadyDrivers.length,
      totalDrivers: activeDrivers.length,
      averageScore: behaviorAverageScore,
      completedMissions: completedDriverMissions.length,
      incidents: behaviorIncidentCount,
      cancellations: cancelledDriverMissions.length,
      punctualityRate: onTimeRate,
      confidence: behaviorReadyDrivers.length > 0 && completedDriverMissions.length > 0 ? 'high' : behaviorReadyDrivers.length > 0 ? 'medium' : 'low',
      recommendation:
        behaviorReadyDrivers.length === 0
          ? 'Brancher ratings, retards et incidents par chauffeur avant classement.'
          : behaviorIncidentCount > 0
            ? 'Auditer les chauffeurs avec incidents et retards récents.'
            : 'Ajouter temps pickup/livraison par chauffeur pour affiner le score.',
    };
    const capabilities: OperationalModel['capabilities'] = [
      {
        id: 'fleet-tracking',
        label: 'Fleet Tracking',
        status: vehicles.length > 0 && drivers.length > 0 ? 'partial' : 'connect',
        source: vehicles.length > 0 ? 'vehicles + drivers + missions' : 'vehicles endpoint',
        confidence: vehicles.length > 0 && drivers.length > 0 ? 'medium' : 'low',
        nextAction: hasTrackingPoints ? 'Lier positions live aux véhicules' : 'Brancher positions live par véhicule',
      },
      {
        id: 'gps-monitoring',
        label: 'GPS Monitoring',
        status: gpsHealth.status === 'active' ? 'active' : gpsHealth.status === 'partial' ? 'partial' : 'connect',
        source: hasTrackingPoints ? 'tracking-points' : 'tracking endpoint',
        confidence: gpsHealth.confidence,
        nextAction: gpsHealth.recommendation,
      },
      {
        id: 'driver-behavior',
        label: 'Driver Behavior Analytics',
        status: driverBehavior.status,
        source: behaviorReadyDrivers.length > 0 ? 'driver ratings + missions' : 'driver metrics',
        confidence: driverBehavior.confidence,
        nextAction: driverBehavior.recommendation,
      },
      {
        id: 'fuel-control',
        label: 'Fuel Control',
        status: 'connect',
        source: 'fuel usage endpoint',
        confidence: 'low',
        nextAction: 'Créer contrat coût carburant par mission/véhicule',
      },
      {
        id: 'trip-management',
        label: 'Trip Management',
        status: tasks.length > 0 ? 'active' : 'partial',
        source: 'logistics tasks + trips',
        confidence: tasks.length > 0 ? 'high' : 'medium',
        nextAction: tasks.length > 0 ? 'Brancher preuve photo et SLA détaillé' : 'Attendre missions terrain',
      },
      {
        id: 'vehicle-health',
        label: 'Vehicle Health',
        status: vehicles.length > 0 ? 'active' : maintenance.length > 0 ? 'partial' : 'connect',
        source: vehicles.length > 0 ? 'vehicles + maintenance' : 'maintenance endpoint',
        confidence: vehicles.length > 0 ? 'high' : maintenance.length > 0 ? 'medium' : 'low',
        nextAction: 'Bloquer assignation si assurance ou maintenance overdue',
      },
      {
        id: 'stock',
        label: 'Stock / Supplies',
        status: 'connect',
        source: 'stock endpoint',
        confidence: 'low',
        nextAction: 'Créer stock dépôt/chauffeur pour sacs, étiquettes et consommables',
      },
      {
        id: 'connectivity',
        label: 'Connectivity',
        status: 'connect',
        source: 'driver app heartbeat',
        confidence: 'low',
        nextAction: 'Ajouter dernier ping, version app, offline queue et sync pending',
      },
    ];
    const operationalExceptions = [
      ...failedTasks.map((task) => ({
        id: `task-${task.id}`,
        type: 'Mission bloquée',
        reference: task.order_number || task.id,
        commune: task.pickup_commune || task.delivery_commune || 'Zone inconnue',
        impact: task.status === 'expired' ? 'SLA expiré' : 'Échec mission',
        severity: 'critical' as const,
        target: 'dispatch' as const,
        missionId: task.id,
        zone: task.pickup_commune || task.delivery_commune || undefined,
      })),
      ...openTickets.slice(0, 4).map((ticket) => ({
        id: `ticket-${ticket.id}`,
        type: ticket.priority === 'high' || ticket.priority === 'urgent' ? 'Ticket critique' : 'Ticket support',
        reference: ticket.title || ticket.id,
        commune: ticket.category || 'Support',
        impact: ticket.status,
        severity: ticket.priority === 'high' || ticket.priority === 'urgent' ? ('critical' as const) : ('warning' as const),
        target: 'reports' as const,
      })),
      ...activeMaintenance.slice(0, 4).map((event) => ({
        id: `maintenance-${event.id}`,
        type: event.status === 'overdue' ? 'Maintenance overdue' : 'Maintenance active',
        reference: event.vehiclePlate || event.vehicleId,
        commune: event.type,
        impact: event.vehicleAvailable ? event.status : 'Véhicule bloqué',
        severity: event.status === 'overdue' || !event.vehicleAvailable ? ('critical' as const) : ('warning' as const),
        target: 'maintenance' as const,
      })),
      ...fleetOutOfService.slice(0, 3).map((vehicle) => ({
        id: `vehicle-${vehicle.id}`,
        type: 'Véhicule indisponible',
        reference: vehicle.plate,
        commune: vehicle.zone || vehicle.location || 'Flotte',
        impact: vehicle.maintenance.status === 'overdue' ? 'Maintenance overdue' : vehicle.status,
        severity: 'warning' as const,
        target: 'maintenance' as const,
      })),
    ].slice(0, 10);

    return {
      openTasks,
      activeTasks,
      completedTasks,
      failedTasks,
      backlogItems: backlogItemsFromLogisticsTasks(openTasks),
      completionRate,
      onTimeRate,
      behaviorScore,
      activeDrivers,
      availableDrivers,
      lastClosedMissionAgo: minutesAgoLabel(lastCompletedTask?.completed_at),
      fieldActivity,
      priorityMissions,
      topZones,
      readyDrivers: drivers
        .map((driver) => ({
          id: driver.id,
          name: driver.user_name || driver.user_email || `Driver ${driver.id.slice(0, 6)}`,
          vehicle: driver.vehicle_type || 'Véhicule à confirmer',
          zone: 'Kinshasa',
          score: Math.round(Number(driver.rating_avg) * 20),
          ratingCount: Number(driver.rating_count || 0),
          isAvailable: driver.status === 'active' && driver.is_available,
        }))
        .filter((driver) => driver.isAvailable && driver.ratingCount > 0 && driver.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((driver) => ({
          id: driver.id,
          name: driver.name,
          vehicle: driver.vehicle,
          zone: driver.zone,
          score: driver.score,
        })),
      corridorPipeline,
      health: [
        {
          label: 'Commande',
          status: toCorridorHealth(periodOrders.length > 0 ? 'SAIN' : 'ATTENTION'),
          detail:
            periodOrders.length > 0
              ? `${periodOrders.length} créée(s) ${periodLabel}`
              : lastOrderAny
                ? `Dernière ${minutesAgoLabel(lastOrderAny.created_at)}`
                : 'En attente de flux',
        },
        {
          label: 'Paiement',
          status: toCorridorHealth(
            periodOrders.length > 0 && paidOrders.length < periodOrders.length ? 'ATTENTION' : 'SAIN',
          ),
          detail:
            periodOrders.length > 0
              ? `${paymentSuccessRate}% succès`
              : orders.length > 0
                ? `${paymentSuccessAllTime}% succès global`
                : 'Aucun flux paiement',
        },
        {
          label: 'Logistique',
          status: toCorridorHealth(failedTasks.length > 0 ? 'DEGRADE' : activeTasks.length > 0 || openTasks.length > 0 ? 'SAIN' : 'ATTENTION'),
          detail:
            failedTasks.length > 0
              ? `${failedTasks.length} anomalie(s)`
              : `${activeTasks.length} active(s) · ${openTasks.length} ouverte(s)`,
        },
        {
          label: 'Support',
          status: toCorridorHealth(openTickets.length > 0 ? 'ATTENTION' : 'SAIN'),
          detail: openTickets.length > 0 ? `${openTickets.length} ticket(s) ouvert(s)` : 'File support stable',
        },
        {
          label: 'Avis',
          status: reviewsAvailable
            ? toCorridorHealth(
                (reviewsDashboard?.negative_queue.length || 0) > 3
                  ? 'DEGRADE'
                  : (reviewsDashboard?.kpis.low_star || 0) > 0
                    ? 'ATTENTION'
                    : 'SAIN',
              )
            : 'ATTENTION',
          detail: reviewsAvailable
            ? publishedReviews > 0
              ? `${publishedReviews} avis · ${reviewsDashboard?.kpis.avg_rating?.toFixed(1) ?? '—'}★`
              : 'Aucun avis récent'
            : 'Module avis en attente de données',
          unavailable: !reviewsAvailable,
        },
        {
          label: 'Fidélité',
          status: loyaltyAvailable
            ? toCorridorHealth(
                (loyaltyDashboard?.health.fraud_risk || 0) > 60
                  ? 'DEGRADE'
                  : (loyaltyDashboard?.health.fraud_risk || 0) > 20
                    ? 'ATTENTION'
                    : 'SAIN',
              )
            : 'ATTENTION',
          detail: loyaltyAvailable
            ? `Score ${loyaltyDashboard?.health.score ?? 0}/100`
            : 'Module fidélité en attente de données',
          unavailable: !loyaltyAvailable,
        },
        {
          label: 'Promotions',
          status: campaignsAvailable
            ? toCorridorHealth(
                (campaignDashboard?.watchlist.length || 0) > 4
                  ? 'DEGRADE'
                  : (campaignDashboard?.watchlist.length || 0) > 0
                    ? 'ATTENTION'
                    : 'SAIN',
              )
            : 'ATTENTION',
          detail: campaignsAvailable
            ? `${campaignDashboard?.watchlist.length ?? 0} alerte(s) campagne`
            : 'Module promotions en attente de données',
          unavailable: !campaignsAvailable,
        },
      ],
      activitySignals,
      networkPulse,
      decisions,
      capacitySummary,
      mapZones: topZones,
      openTicketsCount: openTickets.length,
      fleet,
      operationalExceptions,
      capabilities,
      gpsHealth,
      driverBehavior,
    };
  }, [
    tasks,
    drivers,
    orders,
    tickets,
    vehicles,
    maintenance,
    period,
    reviewsDashboard,
    loyaltyDashboard,
    campaignDashboard,
    reviewsAvailable,
    loyaltyAvailable,
    campaignsAvailable,
    driverPositions,
  ]);

  return {
    model,
    activity,
    loadingSources,
    syncStatus,
    driverPositions,
    loadSources,
  };
}

export type OperationalAlerts = ReturnType<typeof useRealTimeAlerts>['alerts'];

export type NavigateHandler = (
  section: string,
  options?: { missionId?: string; driverName?: string; zone?: string },
) => void;

export type OperationalTowerMode = DataMode;
