import type {
  Zone,
  ZoneKpis,
  ZoneDistribution,
  ZoneEtaEntry,
  ZoneAlert,
  ZoneHeatmap,
  ZoneDispatcherSnapshot,
  ZoneTruthAnomaly,
  ZoneSlaSummary,
  ZonesCenterBundle,
  ZoneTariff,
} from './zones-types';

const defaultTariff = (base: number): ZoneTariff => ({
  base,
  express: base + 1.5,
  night: base + 2,
  weekend: base + 1,
  outOfZone: base + 3,
  perKm: 0.5,
  history: [
    { date: '01/06/2026', base, changedBy: 'Admin' },
    { date: '15/05/2026', base: base - 0.5, changedBy: 'Admin' },
  ],
});

function zone(partial: Partial<Zone> & Pick<Zone, 'id' | 'name' | 'code' | 'status' | 'statusLabel' | 'statusColor' | 'health' | 'healthColor' | 'baseTariff' | 'ordersPerDay' | 'slaPercent' | 'avgDeliveryMinutes' | 'mapX' | 'mapY'>): Zone {
  const rev = partial.ordersPerDay ? partial.ordersPerDay * 19.5 : 4000;
  return {
    commune: partial.name,
    stats: {
      ordersPerDay: partial.ordersPerDay ?? 100,
      revenuePerDay: rev,
      avgDeliveryMinutes: partial.avgDeliveryMinutes ?? 32,
      slaPercent: partial.slaPercent ?? 94,
      driversAvailable: 8,
      pickups: Math.round((partial.ordersPerDay ?? 100) * 0.4),
      deliveries: Math.round((partial.ordersPerDay ?? 100) * 0.6),
      incidents: 1,
    },
    performance: {
      revenue: rev * 7,
      commission: rev * 0.2,
      deliveries: partial.ordersPerDay ?? 100,
      profit: rev * 0.35,
      growthPercent: 12,
    },
    tariff: defaultTariff(partial.baseTariff ?? 3),
    ...partial,
  };
}

export const fixtureZones: Zone[] = [
  zone({ id: 'Z-GOM', name: 'Gombe', code: 'GOM', status: 'active', statusLabel: 'Actif', statusColor: 'bg-green-100 text-green-700', health: 'healthy', healthColor: '#22C55E', baseTariff: 3, ordersPerDay: 218, slaPercent: 96, avgDeliveryMinutes: 28, mapX: 170, mapY: 70 }),
  zone({ id: 'Z-LIM', name: 'Limete', code: 'LIM', status: 'active', statusLabel: 'Actif', statusColor: 'bg-green-100 text-green-700', health: 'healthy', healthColor: '#22C55E', baseTariff: 3.5, ordersPerDay: 162, slaPercent: 94, avgDeliveryMinutes: 32, mapX: 260, mapY: 90 }),
  zone({ id: 'Z-NGA', name: 'Ngaliema', code: 'NGA', status: 'active', statusLabel: 'Actif', statusColor: 'bg-green-100 text-green-700', health: 'healthy', healthColor: '#22C55E', baseTariff: 3, ordersPerDay: 134, slaPercent: 95, avgDeliveryMinutes: 35, mapX: 100, mapY: 130 }),
  zone({ id: 'Z-BAN', name: 'Bandalungwa', code: 'BAN', status: 'active', statusLabel: 'Actif', statusColor: 'bg-green-100 text-green-700', health: 'healthy', healthColor: '#22C55E', baseTariff: 3.5, ordersPerDay: 126, slaPercent: 93, avgDeliveryMinutes: 36, mapX: 150, mapY: 170 }),
  zone({ id: 'Z-KIN', name: 'Kintambo', code: 'KIN', status: 'at_risk', statusLabel: 'À risque', statusColor: 'bg-orange-100 text-orange-700', health: 'warning', healthColor: '#F59E0B', baseTariff: 4, ordersPerDay: 34, slaPercent: 89, avgDeliveryMinutes: 45, mapX: 130, mapY: 110 }),
  zone({ id: 'Z-MAS', name: 'Masina', code: 'MAS', status: 'at_risk', statusLabel: 'À risque', statusColor: 'bg-orange-100 text-orange-700', health: 'warning', healthColor: '#F59E0B', baseTariff: 4, ordersPerDay: 76, slaPercent: 91, avgDeliveryMinutes: 42, mapX: 310, mapY: 120 }),
  zone({ id: 'Z-KAL', name: 'Kalamu', code: 'KAL', status: 'active', statusLabel: 'Actif', statusColor: 'bg-green-100 text-green-700', health: 'healthy', healthColor: '#22C55E', baseTariff: 3.5, ordersPerDay: 58, slaPercent: 92, avgDeliveryMinutes: 38, mapX: 220, mapY: 200 }),
  zone({ id: 'Z-LIN', name: 'Lingwala', code: 'LIN', status: 'saturated', statusLabel: 'Saturé', statusColor: 'bg-red-100 text-red-700', health: 'saturated', healthColor: '#EF4444', baseTariff: 3, ordersPerDay: 52, slaPercent: 87, avgDeliveryMinutes: 48, mapX: 200, mapY: 80 }),
  zone({ id: 'Z-NGI', name: 'Ngiri-Ngiri', code: 'NGI', status: 'active', statusLabel: 'Actif', statusColor: 'bg-green-100 text-green-700', health: 'healthy', healthColor: '#22C55E', baseTariff: 4, ordersPerDay: 42, slaPercent: 90, avgDeliveryMinutes: 40, mapX: 180, mapY: 150 }),
  zone({ id: 'Z-MAT', name: 'Matete', code: 'MAT', status: 'active', statusLabel: 'Actif', statusColor: 'bg-green-100 text-green-700', health: 'healthy', healthColor: '#22C55E', baseTariff: 4, ordersPerDay: 38, slaPercent: 91, avgDeliveryMinutes: 41, mapX: 280, mapY: 180 }),
  zone({ id: 'Z-KIM', name: 'Kimbanseke', code: 'KIM', status: 'inactive', statusLabel: 'Inactive', statusColor: 'bg-gray-100 text-gray-600', health: 'inactive', healthColor: '#9CA3AF', baseTariff: 5, ordersPerDay: 0, slaPercent: 0, avgDeliveryMinutes: 0, mapX: 340, mapY: 200 }),
  zone({ id: 'Z-MON', name: 'Mont-Ngafula', code: 'MON', status: 'inactive', statusLabel: 'Inactive', statusColor: 'bg-gray-100 text-gray-600', health: 'inactive', healthColor: '#9CA3AF', baseTariff: 5, ordersPerDay: 0, slaPercent: 0, avgDeliveryMinutes: 0, mapX: 80, mapY: 200 }),
];

export const zoneKpis: ZoneKpis = {
  activeZones: 12,
  activePercent: 100,
  atRiskZones: 2,
  atRiskChange: 1,
  ordersPerDay: 842,
  ordersChange: 15,
  revenuePerDay: 4250,
  revenueChange: 18,
  avgDeliveryMinutes: 32,
  deliveryChange: -5,
  globalSla: 94,
  slaChange: 4,
  saturatedZones: 1,
};

export const zoneDistribution: ZoneDistribution[] = [
  { zone: 'Gombe', percent: 26, count: 218, color: '#2563EB' },
  { zone: 'Limete', percent: 19, count: 162, color: '#8B5CF6' },
  { zone: 'Ngaliema', percent: 16, count: 134, color: '#22C55E' },
  { zone: 'Bandalungwa', percent: 15, count: 126, color: '#F59E0B' },
  { zone: 'Masina', percent: 9, count: 76, color: '#EF4444' },
  { zone: 'Autres', percent: 15, count: 126, color: '#6B7280' },
];

export const zoneEtaAnalytics: ZoneEtaEntry[] = [
  { zone: 'Gombe', minutes: 28, color: '#22C55E' },
  { zone: 'Limete', minutes: 32, color: '#3B82F6' },
  { zone: 'Ngaliema', minutes: 35, color: '#8B5CF6' },
  { zone: 'Bandalungwa', minutes: 36, color: '#F59E0B' },
  { zone: 'Kalamu', minutes: 38, color: '#F97316' },
  { zone: 'Masina', minutes: 42, color: '#EF4444' },
  { zone: 'Kintambo', minutes: 45, color: '#DC2626' },
  { zone: 'Lingwala', minutes: 48, color: '#991B1B' },
];

export const zoneAlerts: ZoneAlert[] = [
  { id: 'A1', zone: 'Kintambo', type: 'sla', title: 'SLA faible', detail: 'SLA 89% (seuil < 90%)', severity: 'warning', severityLabel: 'Attention' },
  { id: 'A2', zone: 'Masina', type: 'eta', title: 'Temps excessif', detail: 'ETA moyen 42 min', severity: 'warning', severityLabel: 'Attention' },
  { id: 'A3', zone: 'Lingwala', type: 'saturation', title: 'Surcharge', detail: 'Zone saturée — capacité dépassée', severity: 'critical', severityLabel: 'Critique' },
  { id: 'A4', zone: 'Kintambo', type: 'drivers', title: 'Manque chauffeurs', detail: '2 chauffeurs disponibles seulement', severity: 'warning', severityLabel: 'Attention' },
  { id: 'A5', zone: 'Masina', type: 'disputes', title: 'Trop de litiges', detail: '4 litiges cette semaine', severity: 'info', severityLabel: 'Info' },
];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = ['6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h'];

export const zoneHeatmap: ZoneHeatmap = {
  days: DAYS,
  hours: HOURS,
  maxCount: 85,
  cells: DAYS.flatMap((day, di) =>
    HOURS.map((hour, hi) => ({
      day,
      hour,
      count: Math.round(20 + Math.sin((di + hi) * 0.8) * 30 + (hi === 3 || hi === 5 ? 25 : 0)),
    }))
  ),
};

export const zoneDispatcherSnapshots: ZoneDispatcherSnapshot[] = [
  { zone: 'Gombe', driversAvailable: 8, pickups: 42, deliveries: 65, incidents: 1 },
  { zone: 'Limete', driversAvailable: 5, pickups: 28, deliveries: 48, incidents: 0 },
  { zone: 'Ngaliema', driversAvailable: 3, pickups: 18, deliveries: 32, incidents: 1 },
];

export const zoneTruthAnomalies: ZoneTruthAnomaly[] = [
  { id: 'T1', zone: 'Kintambo', title: 'Chauffeur absent', count: 3 },
  { id: 'T2', zone: 'Masina', title: 'Mission non assignée', count: 5 },
  { id: 'T3', zone: 'Lingwala', title: 'Livraison hors SLA', count: 8 },
];

export const zoneSlaSummary: ZoneSlaSummary = {
  avgSla: 94,
  criticalZones: 2,
  breachedZones: 1,
};

export function zonesFixtureBundle(): ZonesCenterBundle {
  return {
    kpis: zoneKpis,
    zones: fixtureZones,
    distribution: zoneDistribution,
    etaAnalytics: zoneEtaAnalytics,
    alerts: zoneAlerts,
    heatmap: zoneHeatmap,
    dispatcherSnapshots: zoneDispatcherSnapshots,
    truthAnomalies: zoneTruthAnomalies,
    slaSummary: zoneSlaSummary,
    degraded: true,
  };
}
