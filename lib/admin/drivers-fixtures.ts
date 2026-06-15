import { computeDriverScore } from './drivers-scoring';
import type {
  Driver,
  DriverKpis,
  DriverHealthOverview,
  DriverMapPoint,
  DriverRankingEntry,
  DriverSlaData,
  DriverIncident,
  DriverReward,
  DriverWatchItem,
  DriverZoneAvailability,
  DriverRevenueTrend,
  DriverActivity,
  DriversCenterBundle,
  DriverDocument,
  DriverMissionHistory,
  DriverAvailabilityDay,
} from './drivers-types';

export const defaultDocs = (): DriverDocument[] => [
  { id: 'd1', type: 'license', label: 'Permis', status: 'valid', statusLabel: 'Validé', expiryDate: '2027-06-15' },
  { id: 'd2', type: 'id', label: 'Carte identité', status: 'valid', statusLabel: 'Validé', expiryDate: '2028-03-20' },
  { id: 'd3', type: 'insurance', label: 'Assurance', status: 'valid', statusLabel: 'Validé', expiryDate: '2026-12-01' },
  { id: 'd4', type: 'registration', label: 'Carte grise', status: 'renew', statusLabel: 'À renouveler', expiryDate: '2026-04-30' },
  { id: 'd5', type: 'vehicle_photo', label: 'Photo véhicule', status: 'valid', statusLabel: 'Validé', expiryDate: '—' },
];

export const defaultHistory = (): DriverMissionHistory[] => [
  { id: 'M-7839', date: '08/06', client: 'Jean Tshibangu', amount: 4500, duration: '32 min', result: 'Terminée', resultColor: 'text-green-600' },
  { id: 'M-7835', date: '07/06', client: 'Marie Kambale', amount: 3800, duration: '28 min', result: 'Terminée', resultColor: 'text-green-600' },
  { id: 'M-7830', date: '07/06', client: 'David Mulumba', amount: 5200, duration: '45 min', result: 'Retard', resultColor: 'text-orange-600' },
];

export const defaultAvailability = (): DriverAvailabilityDay[] => [
  { date: '2026-06-02', label: 'Lun', status: 'available' },
  { date: '2026-06-03', label: 'Mar', status: 'busy' },
  { date: '2026-06-04', label: 'Mer', status: 'available' },
  { date: '2026-06-05', label: 'Jeu', status: 'pause' },
  { date: '2026-06-06', label: 'Ven', status: 'busy' },
  { date: '2026-06-07', label: 'Sam', status: 'available' },
  { date: '2026-06-08', label: 'Dim', status: 'leave' },
];

function makeDriver(partial: Partial<Driver> & Pick<Driver, 'id' | 'name' | 'status' | 'statusLabel' | 'statusColor'>): Driver {
  const sla = partial.sla ?? 94;
  const rating = partial.rating ?? 4.5;
  const scoreTotal = computeDriverScore({
    sla,
    rating,
    punctuality: 90,
    acceptance: 88,
    incidentPenalty: partial.performance?.incidents ? partial.performance.incidents * 5 : 5,
  });
  return {
    phone: '+243 81 234 5678',
    email: `${partial.name.toLowerCase().replace(/\s/g, '.')}@laundry-express.cd`,
    address: 'Kinshasa, RDC',
    photoInitials: partial.name.split(' ').map((n) => n[0]).join('').slice(0, 2),
    photoColor: 'bg-blue-100 text-blue-700',
    partner: 'Laundry Express Logistique',
    zone: 'Gombe',
    vehicle: { type: 'Moto', plate: 'KIN-1234', icon: 'truck' },
    missions: 120,
    sla,
    rating,
    revenue: 850,
    score: { total: scoreTotal, sla, rating: rating * 20, punctuality: 90, acceptance: 88, incidents: 95 },
    performance: { completedMissions: 120, avgPickupMinutes: 18, avgDeliveryMinutes: 24, cancellations: 2, incidents: 1 },
    documents: defaultDocs(),
    location: { lat: -4.32, lng: 15.31, zone: 'Gombe', updatedAt: 'il y a 2 min' },
    registeredAt: '15/01/2025',
    badges: [],
    missionHistory: defaultHistory(),
    availability: defaultAvailability(),
    ...partial,
  };
}

export const fixtureDrivers: Driver[] = [
  makeDriver({ id: 'DRV-01', name: 'Koffi A.', status: 'available', statusLabel: 'Disponible', statusColor: 'bg-green-100 text-green-700', zone: 'Gombe', missions: 156, sla: 98, rating: 4.9, revenue: 12450, badges: ['Top Driver', 'SLA Master'] }),
  makeDriver({ id: 'DRV-02', name: 'Grace B.', status: 'on_mission', statusLabel: 'En mission', statusColor: 'bg-blue-100 text-blue-700', zone: 'Limete', missions: 142, sla: 96, rating: 4.8, revenue: 11200 }),
  makeDriver({ id: 'DRV-03', name: 'Patrick N.', status: 'available', statusLabel: 'Disponible', statusColor: 'bg-green-100 text-green-700', zone: 'Ngaliema', missions: 118, sla: 93, rating: 4.5, revenue: 9800 }),
  makeDriver({ id: 'DRV-04', name: 'David M.', status: 'on_mission', statusLabel: 'En mission', statusColor: 'bg-blue-100 text-blue-700', zone: 'Masina', missions: 110, sla: 91, rating: 4.4, revenue: 8900, vehicle: { type: 'Voiture', plate: 'KIN-5678', icon: 'truck' } }),
  makeDriver({ id: 'DRV-05', name: 'Aline K.', status: 'pause', statusLabel: 'Pause', statusColor: 'bg-orange-100 text-orange-700', zone: 'Bandalungwa', missions: 98, sla: 88, rating: 4.2, revenue: 7200 }),
  makeDriver({ id: 'DRV-06', name: 'Jean K.', status: 'offline', statusLabel: 'Offline', statusColor: 'bg-gray-100 text-gray-600', zone: 'Kalamu', missions: 85, sla: 85, rating: 4.0, revenue: 6100, location: null }),
  makeDriver({ id: 'DRV-07', name: 'Samuel L.', status: 'suspended', statusLabel: 'Suspendu', statusColor: 'bg-red-100 text-red-700', zone: 'Gombe', missions: 45, sla: 62, rating: 3.2, revenue: 2100, performance: { completedMissions: 45, avgPickupMinutes: 28, avgDeliveryMinutes: 35, cancellations: 8, incidents: 5 } }),
  makeDriver({ id: 'DRV-08', name: 'Paul M.', status: 'available', statusLabel: 'Disponible', statusColor: 'bg-green-100 text-green-700', zone: 'Limete', missions: 125, sla: 95, rating: 4.7, revenue: 10500, badges: ['100 Missions'] }),
];

export const driverKpis: DriverKpis = {
  registered: 32,
  available: 18,
  onMission: 11,
  offline: 3,
  avgSla: 94,
  avgRating: 4.8,
  totalRevenue: 12450,
  openIncidents: 2,
};

export const driverHealth: DriverHealthOverview = {
  available: 18,
  busy: 11,
  pause: 1,
  offline: 2,
  suspended: 1,
  availablePercent: 56,
  busyPercent: 34,
  pausePercent: 4,
  offlinePercent: 6,
  suspendedPercent: 0,
};

export const driverMapPoints: DriverMapPoint[] = [
  { id: 'DRV-01', name: 'Koffi A.', lat: -4.32, lng: 15.31, status: 'available' },
  { id: 'DRV-02', name: 'Grace B.', lat: -4.35, lng: 15.28, status: 'on_mission' },
  { id: 'DRV-03', name: 'Patrick N.', lat: -4.30, lng: 15.33, status: 'available' },
  { id: 'DRV-04', name: 'David M.', lat: -4.37, lng: 15.30, status: 'on_mission' },
  { id: 'DRV-05', name: 'Aline K.', lat: -4.34, lng: 15.29, status: 'pause' },
  { id: 'cluster-gombe', name: 'Gombe', lat: -4.31, lng: 15.30, status: 'available', clusterCount: 18 },
  { id: 'cluster-limete', name: 'Limete', lat: -4.36, lng: 15.27, status: 'on_mission', clusterCount: 11 },
];

export const driverRanking: DriverRankingEntry[] = fixtureDrivers
  .map((d) => ({ id: d.id, name: d.name, score: d.score.total, sla: d.sla, rating: d.rating, missions: d.missions }))
  .sort((a, b) => b.score - a.score);

export const driverSlaData: DriverSlaData = {
  inSla: 94,
  atRisk: 12,
  breached: 3,
  inSlaPercent: 94,
  atRiskPercent: 5,
  breachedPercent: 1,
};

export const driverIncidents: DriverIncident[] = [
  { id: 'INC-D01', type: 'delay', title: 'Retard important', driverId: 'DRV-06', driverName: 'Jean K.', priority: 'critical', priorityLabel: 'Critique', createdAt: '10:32' },
  { id: 'INC-D02', type: 'client_absent', title: 'Client absent', driverId: 'DRV-05', driverName: 'Aline K.', priority: 'major', priorityLabel: 'Majeur', createdAt: '09:55' },
  { id: 'INC-D03', type: 'refused', title: 'Refus mission', driverId: 'DRV-07', driverName: 'Samuel L.', priority: 'minor', priorityLabel: 'Mineur', createdAt: '09:20' },
  { id: 'INC-D04', type: 'payment', title: 'Paiement bloqué', driverId: 'DRV-04', driverName: 'David M.', priority: 'major', priorityLabel: 'Majeur', createdAt: '08:45' },
  { id: 'INC-D05', type: 'route', title: 'Incident route', driverId: 'DRV-02', driverName: 'Grace B.', priority: 'critical', priorityLabel: 'Critique', createdAt: '08:10' },
];

export const driverRewards: DriverReward[] = [
  { id: 'R1', label: 'Top Driver', icon: 'trophy', driverName: 'Koffi A.', earnedAt: 'Juin 2026' },
  { id: 'R2', label: 'SLA Master', icon: 'shield-check', driverName: 'Koffi A.', earnedAt: 'Mai 2026' },
  { id: 'R3', label: '100 Missions', icon: 'badge-check', driverName: 'Paul M.', earnedAt: 'Avr 2026' },
  { id: 'R4', label: '500 Missions', icon: 'star', driverName: '—', earnedAt: 'Prochain palier' },
];

export const driverWatchList: DriverWatchItem[] = [
  { id: 'W1', category: 'Score faible', count: 2, severity: 'warning' },
  { id: 'W2', category: 'Incidents répétés', count: 1, severity: 'critical' },
  { id: 'W3', category: 'Retards fréquents', count: 3, severity: 'warning' },
  { id: 'W4', category: 'Documents expirés', count: 4, severity: 'critical' },
];

export const driverZoneAvailability: DriverZoneAvailability[] = [
  { zone: 'Gombe', available: 8, total: 12 },
  { zone: 'Limete', available: 5, total: 8 },
  { zone: 'Ngaliema', available: 3, total: 6 },
  { zone: 'Masina', available: 2, total: 6 },
];

export const driverRevenueTrend: DriverRevenueTrend[] = [
  { month: 'Jan', value: 8200 },
  { month: 'Fév', value: 9100 },
  { month: 'Mar', value: 9800 },
  { month: 'Avr', value: 10200 },
  { month: 'Mai', value: 11500 },
  { month: 'Juin', value: 12450 },
];

export const driverActivity: DriverActivity[] = [
  { id: 'A1', time: '10:45', message: 'Mission M-7845 assignée à Koffi A.', icon: 'truck', color: 'text-blue-600' },
  { id: 'A2', time: '10:32', message: 'Jean K. — retard signalé', icon: 'warning', color: 'text-red-600' },
  { id: 'A3', time: '10:18', message: 'Grace B. en mission — Limete', icon: 'mapPin', color: 'text-green-600' },
  { id: 'A4', time: '09:55', message: 'Paul M. disponible — zone Limete', icon: 'badge-check', color: 'text-green-600' },
];

export function driversFixtureBundle(): DriversCenterBundle {
  return {
    kpis: driverKpis,
    drivers: fixtureDrivers,
    health: driverHealth,
    mapPoints: driverMapPoints,
    ranking: driverRanking,
    sla: driverSlaData,
    incidents: driverIncidents,
    rewards: driverRewards,
    watchList: driverWatchList,
    zoneAvailability: driverZoneAvailability,
    revenueTrend: driverRevenueTrend,
    activity: driverActivity,
    degraded: true,
  };
}
