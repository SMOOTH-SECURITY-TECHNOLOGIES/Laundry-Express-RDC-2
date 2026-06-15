export type MissionStatus =
  | 'pending'
  | 'assigned'
  | 'en_route'
  | 'pickup'
  | 'delivery'
  | 'completed'
  | 'delayed'
  | 'incident';

export type DriverAvailability = 'available' | 'busy' | 'offline' | 'pause';

export type IncidentPriority = 'critical' | 'major' | 'minor';

export interface DispatcherKpis {
  openMissions: number;
  activeMissions: number;
  activePercent: number;
  availableDrivers: number;
  totalDrivers: number;
  estimatedEarnings: number;
  onTimePercent: number;
}

export interface DriverRecommendation {
  id: string;
  name: string;
  distanceKm: number;
  score: number;
}

export interface BacklogMission {
  id: string;
  orderId: string;
  client: string;
  scheduledTime: string;
  commune: string;
  address: string;
  weightKg: number;
  service: string;
  recommendedDriver: DriverRecommendation | null;
  alternatives: DriverRecommendation[];
}

export interface ActiveMission {
  id: string;
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  client: string;
  clientPhone: string;
  address: string;
  weightKg: number;
  service: string;
  status: MissionStatus;
  statusLabel: string;
  statusColor: string;
  eta: string;
  commune: string;
}

export interface AvailableDriver {
  id: string;
  name: string;
  distanceKm: number;
  availability: DriverAvailability;
  availabilityLabel: string;
  score: number;
  activeMissions: number;
  zone: string;
  phone: string;
}

export interface DriverHealth {
  available: number;
  busy: number;
  offline: number;
  pause: number;
}

export interface DispatcherSlaData {
  inSla: number;
  atRisk: number;
  breached: number;
  inSlaPercent: number;
  atRiskPercent: number;
  breachedPercent: number;
}

export type MapPointType = 'driver' | 'pickup' | 'delivery' | 'incident';

export interface MapPoint {
  id: string;
  type: MapPointType;
  lat: number;
  lng: number;
  label: string;
}

export interface MapCluster {
  count: number;
  x: number;
  y: number;
  color: string;
}

export interface MapZoneKpi {
  name: string;
  revenue: number;
  etaMinutes: number;
}

export interface DispatcherIncident {
  id: string;
  type: string;
  title: string;
  priority: IncidentPriority;
  priorityLabel: string;
  missionId: string;
  orderId: string;
  createdAt: string;
}

export interface RevenueImpact {
  daily: number;
  weekly: number;
  monthly: number;
  logisticsCost: number;
  logisticsMargin: number;
}

export interface TopDriver {
  id: string;
  name: string;
  score: number;
  sla: number;
  rating: number;
  missions: number;
}

export interface HourlyMissionCount {
  hour: string;
  count: number;
}

export interface DispatcherAnalytics {
  missionsPerHour: HourlyMissionCount[];
  avgPickupMinutes: number;
  avgDeliveryMinutes: number;
  delayRate: number;
  cancellationRate: number;
}

export interface DispatcherCenterBundle {
  kpis: DispatcherKpis;
  backlog: BacklogMission[];
  activeMissions: ActiveMission[];
  drivers: AvailableDriver[];
  driverHealth: DriverHealth;
  sla: DispatcherSlaData;
  mapPoints: MapPoint[];
  mapClusters: MapCluster[];
  mapZoneKpis: MapZoneKpi[];
  incidents: DispatcherIncident[];
  revenue: RevenueImpact;
  topDrivers: TopDriver[];
  analytics: DispatcherAnalytics;
  degraded: boolean;
}

export interface AssignMissionPayload {
  missionId: string;
  driverId: string;
}

export interface AutoDispatchResult {
  assigned: number;
  skipped: number;
  details: Array<{ missionId: string; driverId: string; driverName: string; score: number }>;
}

export type DispatcherWsChannel =
  | 'mission.created'
  | 'mission.assigned'
  | 'mission.started'
  | 'mission.pickup'
  | 'mission.delivery'
  | 'mission.completed'
  | 'mission.cancelled'
  | 'driver.online'
  | 'driver.offline'
  | 'driver.location'
  | 'sla.breach'
  | 'incident.created';

export interface DispatcherWsEvent {
  channel: DispatcherWsChannel;
  payload: Record<string, unknown>;
  timestamp: string;
}
