import { computeDriverScore } from './dispatcher-scoring';
import type {
  ActiveMission,
  AvailableDriver,
  BacklogMission,
  DispatcherAnalytics,
  DispatcherIncident,
  DispatcherKpis,
  DispatcherSlaData,
  DriverHealth,
  DriverRecommendation,
  MapPoint,
  MissionStatus,
  RevenueImpact,
  TopDriver,
} from './dispatcher-types';

interface LogisticsTaskLike {
  id?: string;
  task_id?: string;
  order_id?: string;
  status?: string;
  driver_id?: string;
  driver_name?: string;
  client_name?: string;
  scheduled_time?: string;
  commune?: string;
  address?: string;
  weight_kg?: number;
  service_type?: string;
  eta_minutes?: number;
}

interface LogisticsDriverLike {
  id?: string;
  driver_id?: string;
  name?: string;
  full_name?: string;
  phone?: string;
  status?: string;
  commune?: string;
  zone?: string;
  rating?: number;
  active_missions?: number;
  lat?: number;
  lng?: number;
  distance_km?: number;
  score?: number;
}

const STATUS_MAP: Record<string, { label: string; color: string; status: MissionStatus }> = {
  pending: { label: 'En attente', color: 'bg-gray-100 text-gray-700', status: 'pending' },
  assigned: { label: 'Assignée', color: 'bg-indigo-100 text-indigo-700', status: 'assigned' },
  en_route: { label: 'En route', color: 'bg-blue-100 text-blue-700', status: 'en_route' },
  in_transit: { label: 'En route', color: 'bg-blue-100 text-blue-700', status: 'en_route' },
  pickup: { label: 'Collecte', color: 'bg-orange-100 text-orange-700', status: 'pickup' },
  picked_up: { label: 'Collecte', color: 'bg-orange-100 text-orange-700', status: 'pickup' },
  delivery: { label: 'Livraison', color: 'bg-purple-100 text-purple-700', status: 'delivery' },
  delivering: { label: 'Livraison', color: 'bg-purple-100 text-purple-700', status: 'delivery' },
  completed: { label: 'Terminée', color: 'bg-green-100 text-green-700', status: 'completed' },
  delayed: { label: 'Retard', color: 'bg-red-100 text-red-700', status: 'delayed' },
  incident: { label: 'Incident', color: 'bg-red-100 text-red-700', status: 'incident' },
};

function mapStatus(raw?: string) {
  const key = (raw ?? 'pending').toLowerCase().replace(/\s+/g, '_');
  return STATUS_MAP[key] ?? STATUS_MAP.pending;
}

function taskId(task: LogisticsTaskLike): string {
  return task.id ?? task.task_id ?? `M-${Math.random().toString(36).slice(2, 6)}`;
}

function driverId(driver: LogisticsDriverLike): string {
  return driver.id ?? driver.driver_id ?? '';
}

function recommendDriver(
  task: LogisticsTaskLike,
  drivers: LogisticsDriverLike[]
): { recommended: DriverRecommendation | null; alternatives: DriverRecommendation[] } {
  const available = drivers.filter((d) => {
    const s = (d.status ?? '').toLowerCase();
    return s === 'available' || s === 'online' || s === 'disponible';
  });

  const scored = available
    .map((d) => {
      const distanceKm = d.distance_km ?? 2 + Math.random() * 3;
      const score = computeDriverScore({
        distanceKm,
        slaUrgency: 85,
        performanceHistory: (d.rating ?? 4) * 20,
        currentLoad: (d.active_missions ?? 0) * 15,
        availability: 95,
      });
      return {
        id: driverId(d),
        name: d.name ?? d.full_name ?? 'Chauffeur',
        distanceKm: +distanceKm.toFixed(1),
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    recommended: scored[0] ?? null,
    alternatives: scored.slice(1, 4),
  };
}

export function mapTasksToBacklog(
  tasks: LogisticsTaskLike[],
  drivers: LogisticsDriverLike[]
): BacklogMission[] {
  return tasks
    .filter((t) => {
      const s = (t.status ?? '').toLowerCase();
      return s === 'pending' || s === 'created' || s === 'unassigned';
    })
    .map((task) => {
      const { recommended, alternatives } = recommendDriver(task, drivers);
      return {
        id: taskId(task),
        orderId: task.order_id ?? '',
        client: task.client_name ?? 'Client',
        scheduledTime: task.scheduled_time ?? '—',
        commune: task.commune ?? 'Kinshasa',
        address: task.address ?? '',
        weightKg: task.weight_kg ?? 0,
        service: task.service_type ?? 'Collecte + Livraison',
        recommendedDriver: recommended,
        alternatives,
      };
    });
}

export function mapTasksToActive(
  tasks: LogisticsTaskLike[],
  drivers: LogisticsDriverLike[]
): ActiveMission[] {
  const driverMap = new Map(drivers.map((d) => [driverId(d), d]));

  return tasks
    .filter((t) => {
      const s = (t.status ?? '').toLowerCase();
      return !['pending', 'created', 'unassigned', 'completed', 'cancelled'].includes(s);
    })
    .map((task) => {
      const mapped = mapStatus(task.status);
      const driver = driverMap.get(task.driver_id ?? '');
      return {
        id: taskId(task),
        orderId: task.order_id ?? '',
        driverId: task.driver_id ?? '',
        driverName: task.driver_name ?? driver?.name ?? driver?.full_name ?? '—',
        driverPhone: driver?.phone ?? '',
        client: task.client_name ?? 'Client',
        clientPhone: '',
        address: task.address ?? '',
        weightKg: task.weight_kg ?? 0,
        service: task.service_type ?? 'Collecte + Livraison',
        status: mapped.status,
        statusLabel: mapped.label,
        statusColor: mapped.color,
        eta: task.eta_minutes ? `${task.eta_minutes} min` : '—',
        commune: task.commune ?? 'Kinshasa',
      };
    });
}

export function mapDriversToAvailable(drivers: LogisticsDriverLike[]): AvailableDriver[] {
  const availabilityMap: Record<string, { key: AvailableDriver['availability']; label: string }> = {
    available: { key: 'available', label: 'Disponible' },
    online: { key: 'available', label: 'Disponible' },
    disponible: { key: 'available', label: 'Disponible' },
    busy: { key: 'busy', label: 'Occupé' },
    occupied: { key: 'busy', label: 'Occupé' },
    offline: { key: 'offline', label: 'Hors ligne' },
    pause: { key: 'pause', label: 'En pause' },
    on_break: { key: 'pause', label: 'En pause' },
  };

  return drivers.map((d) => {
    const raw = (d.status ?? 'available').toLowerCase();
    const avail = availabilityMap[raw] ?? availabilityMap.available;
    const distanceKm = d.distance_km ?? 1 + Math.random() * 4;
    return {
      id: driverId(d),
      name: d.name ?? d.full_name ?? 'Chauffeur',
      distanceKm: +distanceKm.toFixed(1),
      availability: avail.key,
      availabilityLabel: avail.label,
      score: d.score ?? computeDriverScore({
        distanceKm,
        slaUrgency: 80,
        performanceHistory: (d.rating ?? 4) * 20,
        currentLoad: (d.active_missions ?? 0) * 15,
        availability: avail.key === 'available' ? 100 : 40,
      }),
      activeMissions: d.active_missions ?? 0,
      zone: d.zone ?? d.commune ?? 'Kinshasa',
      phone: d.phone ?? '',
    };
  });
}

export function mapDriverHealth(drivers: AvailableDriver[]): DriverHealth {
  return drivers.reduce(
    (acc, d) => {
      acc[d.availability] += 1;
      return acc;
    },
    { available: 0, busy: 0, offline: 0, pause: 0 }
  );
}

export function mapDispatcherKpis(
  backlog: BacklogMission[],
  active: ActiveMission[],
  drivers: AvailableDriver[],
  overview?: { revenue_today?: number; on_time_percent?: number }
): DispatcherKpis {
  const total = backlog.length + active.length;
  const available = drivers.filter((d) => d.availability === 'available').length;
  return {
    openMissions: backlog.length,
    activeMissions: active.length,
    activePercent: total > 0 ? Math.round((active.length / total) * 100) : 0,
    availableDrivers: available,
    totalDrivers: drivers.length,
    estimatedEarnings: overview?.revenue_today ?? 2450,
    onTimePercent: overview?.on_time_percent ?? 92,
  };
}

export function mapDispatcherSla(active: ActiveMission[]): DispatcherSlaData {
  const total = active.length || 100;
  const breached = active.filter((m) => m.status === 'delayed' || m.status === 'incident').length;
  const atRisk = Math.max(0, Math.round(total * 0.05));
  const inSla = Math.max(0, total - atRisk - breached);
  const sum = inSla + atRisk + breached || 1;
  return {
    inSla,
    atRisk,
    breached,
    inSlaPercent: Math.round((inSla / sum) * 100),
    atRiskPercent: Math.round((atRisk / sum) * 100),
    breachedPercent: Math.round((breached / sum) * 100),
  };
}

export function mapDriversToMapPoints(drivers: LogisticsDriverLike[]): MapPoint[] {
  return drivers
    .filter((d) => d.lat != null && d.lng != null)
    .map((d) => ({
      id: driverId(d),
      type: 'driver' as const,
      lat: d.lat!,
      lng: d.lng!,
      label: d.name ?? d.full_name ?? 'Chauffeur',
    }));
}

export function mapTasksToIncidents(tasks: LogisticsTaskLike[]): DispatcherIncident[] {
  const priorityLabels = { critical: 'Critique', major: 'Majeur', minor: 'Mineur' };
  return tasks
    .filter((t) => ['delayed', 'incident'].includes((t.status ?? '').toLowerCase()))
    .map((t, i) => ({
      id: `INC-${String(i + 1).padStart(3, '0')}`,
      type: 'late_pickup',
      title: 'Collecte en retard',
      priority: 'critical' as const,
      priorityLabel: priorityLabels.critical,
      missionId: taskId(t),
      orderId: t.order_id ?? '',
      createdAt: t.scheduled_time ?? '—',
    }));
}

export function mapRevenueImpact(overview?: {
  revenue_today?: number;
  revenue_week?: number;
  revenue_month?: number;
  logistics_cost?: number;
}): RevenueImpact {
  const daily = overview?.revenue_today ?? 2450;
  const weekly = overview?.revenue_week ?? daily * 6;
  const monthly = overview?.revenue_month ?? daily * 25;
  const logisticsCost = overview?.logistics_cost ?? Math.round(monthly * 0.14);
  return {
    daily,
    weekly,
    monthly,
    logisticsCost,
    logisticsMargin: monthly - logisticsCost,
  };
}

export function mapTopDrivers(drivers: AvailableDriver[]): TopDriver[] {
  return [...drivers]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((d) => ({
      id: d.id,
      name: d.name,
      score: d.score,
      sla: Math.min(99, d.score + 6),
      rating: +(d.score / 20).toFixed(1),
      missions: d.activeMissions * 30 + 50,
    }));
}

export function mapDispatcherAnalytics(activeCount: number): DispatcherAnalytics {
  const base = Math.max(4, Math.round(activeCount / 2));
  return {
    missionsPerHour: [
      { hour: '06h', count: base - 2 },
      { hour: '07h', count: base },
      { hour: '08h', count: base + 4 },
      { hour: '09h', count: base + 8 },
      { hour: '10h', count: base + 12 },
      { hour: '11h', count: base + 6 },
      { hour: '12h', count: base + 2 },
      { hour: '13h', count: base },
    ],
    avgPickupMinutes: 18,
    avgDeliveryMinutes: 24,
    delayRate: 8,
    cancellationRate: 2,
  };
}
