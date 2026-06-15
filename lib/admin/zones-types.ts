export type ZoneStatus = 'active' | 'at_risk' | 'saturated' | 'inactive';

export type ZoneHealth = 'healthy' | 'warning' | 'saturated' | 'inactive';

export interface ZoneTariff {
  base: number;
  express: number;
  night: number;
  weekend: number;
  outOfZone: number;
  perKm: number;
  history: Array<{ date: string; base: number; changedBy: string }>;
}

export interface ZoneStats {
  ordersPerDay: number;
  revenuePerDay: number;
  avgDeliveryMinutes: number;
  slaPercent: number;
  driversAvailable: number;
  pickups: number;
  deliveries: number;
  incidents: number;
}

export interface ZonePerformance {
  revenue: number;
  commission: number;
  deliveries: number;
  profit: number;
  growthPercent: number;
}

export interface Zone {
  id: string;
  name: string;
  commune: string;
  code: string;
  status: ZoneStatus;
  statusLabel: string;
  statusColor: string;
  health: ZoneHealth;
  healthColor: string;
  baseTariff: number;
  avgDeliveryMinutes: number;
  ordersPerDay: number;
  slaPercent: number;
  stats: ZoneStats;
  performance: ZonePerformance;
  tariff: ZoneTariff;
  mapX: number;
  mapY: number;
  mapPath?: string;
}

export interface ZoneKpis {
  activeZones: number;
  activePercent: number;
  atRiskZones: number;
  atRiskChange: number;
  ordersPerDay: number;
  ordersChange: number;
  revenuePerDay: number;
  revenueChange: number;
  avgDeliveryMinutes: number;
  deliveryChange: number;
  globalSla: number;
  slaChange: number;
  saturatedZones: number;
}

export interface ZoneDistribution {
  zone: string;
  percent: number;
  count: number;
  color: string;
}

export interface ZoneEtaEntry {
  zone: string;
  minutes: number;
  color: string;
}

export interface ZoneAlert {
  id: string;
  zone: string;
  type: string;
  title: string;
  detail: string;
  severity: 'critical' | 'warning' | 'info';
  severityLabel: string;
}

export interface ZoneHeatmapCell {
  day: string;
  hour: string;
  count: number;
}

export interface ZoneHeatmap {
  days: string[];
  hours: string[];
  cells: ZoneHeatmapCell[];
  maxCount: number;
}

export interface ZoneDispatcherSnapshot {
  zone: string;
  driversAvailable: number;
  pickups: number;
  deliveries: number;
  incidents: number;
}

export interface ZoneTruthAnomaly {
  id: string;
  zone: string;
  title: string;
  count: number;
}

export interface ZoneSlaSummary {
  avgSla: number;
  criticalZones: number;
  breachedZones: number;
}

export interface ZonesCenterBundle {
  kpis: ZoneKpis;
  zones: Zone[];
  distribution: ZoneDistribution[];
  etaAnalytics: ZoneEtaEntry[];
  alerts: ZoneAlert[];
  heatmap: ZoneHeatmap;
  dispatcherSnapshots: ZoneDispatcherSnapshot[];
  truthAnomalies: ZoneTruthAnomaly[];
  slaSummary: ZoneSlaSummary;
  degraded: boolean;
}

export interface CreateZonePayload {
  name: string;
  commune: string;
  code: string;
  baseTariff: number;
}
