export type DriverStatus = 'available' | 'on_mission' | 'pause' | 'offline' | 'suspended';

export type VehicleType = 'Moto' | 'Voiture' | 'Camionnette';

export type DocumentStatus = 'valid' | 'expired' | 'renew';

export type IncidentPriority = 'critical' | 'major' | 'minor';

export type AvailabilityDayStatus = 'available' | 'busy' | 'leave' | 'pause';

export interface DriverVehicle {
  type: VehicleType;
  plate: string;
  icon: string;
}

export interface DriverDocument {
  id: string;
  type: string;
  label: string;
  status: DocumentStatus;
  statusLabel: string;
  expiryDate: string;
}

export interface DriverScore {
  total: number;
  sla: number;
  rating: number;
  punctuality: number;
  acceptance: number;
  incidents: number;
}

export interface DriverPerformance {
  completedMissions: number;
  avgPickupMinutes: number;
  avgDeliveryMinutes: number;
  cancellations: number;
  incidents: number;
}

export interface DriverRevenue {
  daily: number;
  weekly: number;
  monthly: number;
  total: number;
}

export interface DriverLocation {
  lat: number;
  lng: number;
  zone: string;
  updatedAt: string;
}

export interface DriverMissionHistory {
  id: string;
  date: string;
  client: string;
  amount: number;
  duration: string;
  result: string;
  resultColor: string;
}

export interface DriverAvailabilityDay {
  date: string;
  label: string;
  status: AvailabilityDayStatus;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  photoInitials: string;
  photoColor: string;
  partner: string;
  zone: string;
  vehicle: DriverVehicle;
  status: DriverStatus;
  statusLabel: string;
  statusColor: string;
  missions: number;
  sla: number;
  rating: number;
  revenue: number;
  score: DriverScore;
  performance: DriverPerformance;
  documents: DriverDocument[];
  location: DriverLocation | null;
  registeredAt: string;
  badges: string[];
  missionHistory: DriverMissionHistory[];
  availability: DriverAvailabilityDay[];
}

export interface DriverKpis {
  registered: number;
  available: number;
  onMission: number;
  offline: number;
  avgSla: number;
  avgRating: number;
  totalRevenue: number;
  openIncidents: number;
}

export interface DriverHealthOverview {
  available: number;
  busy: number;
  pause: number;
  offline: number;
  suspended: number;
  availablePercent: number;
  busyPercent: number;
  pausePercent: number;
  offlinePercent: number;
  suspendedPercent: number;
}

export interface DriverMapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: DriverStatus;
  clusterCount?: number;
}

export interface DriverRankingEntry {
  id: string;
  name: string;
  score: number;
  sla: number;
  rating: number;
  missions: number;
}

export interface DriverSlaData {
  inSla: number;
  atRisk: number;
  breached: number;
  inSlaPercent: number;
  atRiskPercent: number;
  breachedPercent: number;
}

export interface DriverIncident {
  id: string;
  type: string;
  title: string;
  driverId: string;
  driverName: string;
  priority: IncidentPriority;
  priorityLabel: string;
  createdAt: string;
}

export interface DriverReward {
  id: string;
  label: string;
  icon: string;
  driverName: string;
  earnedAt: string;
}

export interface DriverWatchItem {
  id: string;
  category: string;
  count: number;
  severity: 'warning' | 'critical';
}

export interface DriverZoneAvailability {
  zone: string;
  available: number;
  total: number;
}

export interface DriverRevenueTrend {
  month: string;
  value: number;
}

export interface DriverActivity {
  id: string;
  time: string;
  message: string;
  icon: string;
  color: string;
}

export interface DriversCenterBundle {
  kpis: DriverKpis;
  drivers: Driver[];
  health: DriverHealthOverview;
  mapPoints: DriverMapPoint[];
  ranking: DriverRankingEntry[];
  sla: DriverSlaData;
  incidents: DriverIncident[];
  rewards: DriverReward[];
  watchList: DriverWatchItem[];
  zoneAvailability: DriverZoneAvailability[];
  revenueTrend: DriverRevenueTrend[];
  activity: DriverActivity[];
  degraded: boolean;
}

export interface AddDriverPayload {
  name: string;
  phone: string;
  email: string;
  partner: string;
  vehicle: VehicleType;
  zone: string;
}

export type DriverWsChannel =
  | 'driver.online'
  | 'driver.offline'
  | 'driver.location'
  | 'driver.mission_assigned'
  | 'driver.mission_started'
  | 'driver.mission_completed'
  | 'driver.incident';

export interface DriverWsEvent {
  channel: DriverWsChannel;
  payload: Record<string, unknown>;
  timestamp: string;
}
