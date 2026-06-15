import type {
  DispatcherKpis,
  BacklogMission,
  ActiveMission,
  AvailableDriver,
  DriverHealth,
  DispatcherSlaData,
  MapPoint,
  MapCluster,
  MapZoneKpi,
  DispatcherIncident,
  RevenueImpact,
  TopDriver,
  DispatcherAnalytics,
  DispatcherCenterBundle,
} from './dispatcher-types';

export const dispatcherKpis: DispatcherKpis = {
  openMissions: 24,
  activeMissions: 38,
  activePercent: 63,
  availableDrivers: 18,
  totalDrivers: 32,
  estimatedEarnings: 2450,
  onTimePercent: 92,
};

export const dispatcherBacklog: BacklogMission[] = [
  {
    id: 'M-7845',
    orderId: 'ORD-12845',
    client: 'Jean Tshibangu',
    scheduledTime: '10:45',
    commune: 'Gombe',
    address: '12 Av. du Commerce, Gombe',
    weightKg: 4.5,
    service: 'Collecte + Livraison',
    recommendedDriver: { id: 'DRV-01', name: 'Koffi A.', distanceKm: 1.2, score: 92 },
    alternatives: [
      { id: 'DRV-02', name: 'Grace B.', distanceKm: 2.1, score: 85 },
      { id: 'DRV-03', name: 'Patrick N.', distanceKm: 1.8, score: 81 },
    ],
  },
  {
    id: 'M-7846',
    orderId: 'ORD-12846',
    client: 'Marie Kambale',
    scheduledTime: '11:00',
    commune: 'Limete',
    address: '45 Bd Lumumba, Limete',
    weightKg: 3.2,
    service: 'Collecte express',
    recommendedDriver: { id: 'DRV-02', name: 'Grace B.', distanceKm: 2.1, score: 88 },
    alternatives: [
      { id: 'DRV-04', name: 'David M.', distanceKm: 2.3, score: 79 },
      { id: 'DRV-05', name: 'Aline K.', distanceKm: 1.5, score: 86 },
    ],
  },
  {
    id: 'M-7847',
    orderId: 'ORD-12847',
    client: 'David Mulumba',
    scheduledTime: '11:15',
    commune: 'Bandalungwa',
    address: '8 Rue Kasa-Vubu, Bandalungwa',
    weightKg: 6.0,
    service: 'Livraison',
    recommendedDriver: { id: 'DRV-03', name: 'Patrick N.', distanceKm: 1.8, score: 84 },
    alternatives: [
      { id: 'DRV-01', name: 'Koffi A.', distanceKm: 3.0, score: 76 },
      { id: 'DRV-06', name: 'Jean K.', distanceKm: 2.5, score: 80 },
    ],
  },
  {
    id: 'M-7848',
    orderId: 'ORD-12848',
    client: 'Sarah Mwangi',
    scheduledTime: '11:30',
    commune: 'Masina',
    address: '22 Av. Masina, Masina',
    weightKg: 2.8,
    service: 'Collecte + Livraison',
    recommendedDriver: { id: 'DRV-04', name: 'David M.', distanceKm: 2.3, score: 82 },
    alternatives: [
      { id: 'DRV-05', name: 'Aline K.', distanceKm: 3.1, score: 74 },
    ],
  },
  {
    id: 'M-7849',
    orderId: 'ORD-12849',
    client: 'Patrick Nzinga',
    scheduledTime: '11:45',
    commune: 'Ngaliema',
    address: '5 Av. de la Justice, Ngaliema',
    weightKg: 5.1,
    service: 'Collecte',
    recommendedDriver: { id: 'DRV-05', name: 'Aline K.', distanceKm: 1.5, score: 90 },
    alternatives: [
      { id: 'DRV-02', name: 'Grace B.', distanceKm: 2.8, score: 83 },
      { id: 'DRV-01', name: 'Koffi A.', distanceKm: 3.5, score: 72 },
    ],
  },
];

export const dispatcherActiveMissions: ActiveMission[] = [
  {
    id: 'M-7839',
    orderId: 'ORD-12839',
    driverId: 'DRV-01',
    driverName: 'Koffi A.',
    driverPhone: '+243 81 234 5678',
    client: 'Emmanuel Kabila',
    clientPhone: '+243 99 123 4567',
    address: '18 Av. Batetela, Gombe',
    weightKg: 3.5,
    service: 'Collecte + Livraison',
    status: 'en_route',
    statusLabel: 'En route',
    statusColor: 'bg-blue-100 text-blue-700',
    eta: '15 min',
    commune: 'Gombe',
  },
  {
    id: 'M-7840',
    orderId: 'ORD-12840',
    driverId: 'DRV-02',
    driverName: 'Grace B.',
    driverPhone: '+243 82 345 6789',
    client: 'Claudine Mbuyi',
    clientPhone: '+243 97 234 5678',
    address: '33 Bd du 30 Juin, Limete',
    weightKg: 4.0,
    service: 'Collecte',
    status: 'pickup',
    statusLabel: 'Collecte',
    statusColor: 'bg-orange-100 text-orange-700',
    eta: '8 min',
    commune: 'Limete',
  },
  {
    id: 'M-7841',
    orderId: 'ORD-12841',
    driverId: 'DRV-06',
    driverName: 'Jean K.',
    driverPhone: '+243 83 456 7890',
    client: 'Robert Ilunga',
    clientPhone: '+243 98 345 6789',
    address: '7 Rue Kasa-Vubu, Bandalungwa',
    weightKg: 5.5,
    service: 'Livraison',
    status: 'delayed',
    statusLabel: 'Retard',
    statusColor: 'bg-red-100 text-red-700',
    eta: '20 min',
    commune: 'Bandalungwa',
  },
  {
    id: 'M-7842',
    orderId: 'ORD-12842',
    driverId: 'DRV-04',
    driverName: 'David M.',
    driverPhone: '+243 84 567 8901',
    client: 'Nathalie Tshisekedi',
    clientPhone: '+243 96 456 7890',
    address: '55 Av. Masina, Masina',
    weightKg: 2.2,
    service: 'Livraison',
    status: 'delivery',
    statusLabel: 'Livraison',
    statusColor: 'bg-purple-100 text-purple-700',
    eta: '5 min',
    commune: 'Masina',
  },
  {
    id: 'M-7843',
    orderId: 'ORD-12843',
    driverId: 'DRV-03',
    driverName: 'Patrick N.',
    driverPhone: '+243 85 678 9012',
    client: 'Joseph Kabongo',
    clientPhone: '+243 95 567 8901',
    address: '9 Av. de la Justice, Ngaliema',
    weightKg: 3.8,
    service: 'Collecte + Livraison',
    status: 'en_route',
    statusLabel: 'En route',
    statusColor: 'bg-blue-100 text-blue-700',
    eta: '18 min',
    commune: 'Ngaliema',
  },
];

export const dispatcherDrivers: AvailableDriver[] = [
  { id: 'DRV-01', name: 'Koffi A.', distanceKm: 1.2, availability: 'available', availabilityLabel: 'Disponible', score: 92, activeMissions: 4, zone: 'Gombe', phone: '+243 81 234 5678' },
  { id: 'DRV-02', name: 'Grace B.', distanceKm: 2.1, availability: 'busy', availabilityLabel: 'Occupé', score: 88, activeMissions: 3, zone: 'Limete', phone: '+243 82 345 6789' },
  { id: 'DRV-03', name: 'Patrick N.', distanceKm: 1.8, availability: 'available', availabilityLabel: 'Disponible', score: 84, activeMissions: 2, zone: 'Bandalungwa', phone: '+243 85 678 9012' },
  { id: 'DRV-04', name: 'David M.', distanceKm: 2.3, availability: 'busy', availabilityLabel: 'Occupé', score: 82, activeMissions: 5, zone: 'Masina', phone: '+243 84 567 8901' },
  { id: 'DRV-05', name: 'Aline K.', distanceKm: 1.5, availability: 'available', availabilityLabel: 'Disponible', score: 90, activeMissions: 1, zone: 'Ngaliema', phone: '+243 86 789 0123' },
  { id: 'DRV-06', name: 'Jean K.', distanceKm: 3.2, availability: 'pause', availabilityLabel: 'En pause', score: 78, activeMissions: 2, zone: 'Kalamu', phone: '+243 83 456 7890' },
  { id: 'DRV-07', name: 'Samuel L.', distanceKm: 4.1, availability: 'offline', availabilityLabel: 'Hors ligne', score: 75, activeMissions: 0, zone: 'Gombe', phone: '+243 87 890 1234' },
  { id: 'DRV-08', name: 'Paul M.', distanceKm: 2.8, availability: 'available', availabilityLabel: 'Disponible', score: 86, activeMissions: 3, zone: 'Limete', phone: '+243 88 901 2345' },
];

export const dispatcherDriverHealth: DriverHealth = {
  available: 18,
  busy: 10,
  offline: 3,
  pause: 1,
};

export const dispatcherSlaData: DispatcherSlaData = {
  inSla: 94,
  atRisk: 12,
  breached: 3,
  inSlaPercent: 94,
  atRiskPercent: 5,
  breachedPercent: 1,
};

export const dispatcherMapPoints: MapPoint[] = [
  { id: 'd1', type: 'driver', lat: -4.32, lng: 15.31, label: 'Koffi A.' },
  { id: 'd2', type: 'driver', lat: -4.35, lng: 15.28, label: 'Grace B.' },
  { id: 'd3', type: 'driver', lat: -4.30, lng: 15.33, label: 'Patrick N.' },
  { id: 'p1', type: 'pickup', lat: -4.31, lng: 15.29, label: 'Collecte Gombe' },
  { id: 'p2', type: 'pickup', lat: -4.34, lng: 15.31, label: 'Collecte Limete' },
  { id: 'l1', type: 'delivery', lat: -4.36, lng: 15.32, label: 'Livraison Masina' },
  { id: 'l2', type: 'delivery', lat: -4.28, lng: 15.34, label: 'Livraison Ngaliema' },
  { id: 'i1', type: 'incident', lat: -4.37, lng: 15.30, label: 'Retard Bandalungwa' },
];

export const dispatcherMapClusters: MapCluster[] = [
  { count: 18, x: 176, y: 98, color: '#0B5FFF' },
  { count: 11, x: 270, y: 126, color: '#22c55e' },
];

export const dispatcherMapZoneKpis: MapZoneKpi[] = [
  { name: 'Gombe', revenue: 4850, etaMinutes: 38 },
  { name: 'Limete', revenue: 3120, etaMinutes: 44 },
  { name: 'Ngaliema', revenue: 2740, etaMinutes: 52 },
];

export const dispatcherIncidents: DispatcherIncident[] = [
  { id: 'INC-001', type: 'late_pickup', title: 'Collecte en retard', priority: 'critical', priorityLabel: 'Critique', missionId: 'M-7841', orderId: 'ORD-12841', createdAt: '10:32' },
  { id: 'INC-002', type: 'address_not_found', title: 'Adresse introuvable', priority: 'major', priorityLabel: 'Majeur', missionId: 'M-7835', orderId: 'ORD-12835', createdAt: '10:18' },
  { id: 'INC-003', type: 'client_absent', title: 'Client absent', priority: 'minor', priorityLabel: 'Mineur', missionId: 'M-7830', orderId: 'ORD-12830', createdAt: '09:55' },
  { id: 'INC-004', type: 'payment_blocked', title: 'Paiement bloqué', priority: 'major', priorityLabel: 'Majeur', missionId: 'M-7828', orderId: 'ORD-12828', createdAt: '09:40' },
];

export const dispatcherRevenue: RevenueImpact = {
  daily: 2450,
  weekly: 14820,
  monthly: 62400,
  logisticsCost: 8900,
  logisticsMargin: 53500,
};

export const dispatcherTopDrivers: TopDriver[] = [
  { id: 'DRV-01', name: 'Koffi A.', score: 92, sla: 98, rating: 4.9, missions: 156 },
  { id: 'DRV-05', name: 'Aline K.', score: 90, sla: 96, rating: 4.8, missions: 142 },
  { id: 'DRV-02', name: 'Grace B.', score: 88, sla: 95, rating: 4.7, missions: 138 },
  { id: 'DRV-08', name: 'Paul M.', score: 86, sla: 94, rating: 4.6, missions: 125 },
  { id: 'DRV-03', name: 'Patrick N.', score: 84, sla: 93, rating: 4.5, missions: 118 },
  { id: 'DRV-04', name: 'David M.', score: 82, sla: 91, rating: 4.4, missions: 110 },
  { id: 'DRV-06', name: 'Jean K.', score: 78, sla: 88, rating: 4.2, missions: 98 },
  { id: 'DRV-07', name: 'Samuel L.', score: 75, sla: 85, rating: 4.0, missions: 85 },
];

export const dispatcherAnalytics: DispatcherAnalytics = {
  missionsPerHour: [
    { hour: '06h', count: 4 },
    { hour: '07h', count: 8 },
    { hour: '08h', count: 14 },
    { hour: '09h', count: 18 },
    { hour: '10h', count: 22 },
    { hour: '11h', count: 16 },
    { hour: '12h', count: 12 },
    { hour: '13h', count: 10 },
  ],
  avgPickupMinutes: 18,
  avgDeliveryMinutes: 24,
  delayRate: 8,
  cancellationRate: 2,
};

export function dispatcherFixtureBundle(): DispatcherCenterBundle {
  return {
    kpis: dispatcherKpis,
    backlog: dispatcherBacklog,
    activeMissions: dispatcherActiveMissions,
    drivers: dispatcherDrivers,
    driverHealth: dispatcherDriverHealth,
    sla: dispatcherSlaData,
    mapPoints: dispatcherMapPoints,
    mapClusters: dispatcherMapClusters,
    mapZoneKpis: dispatcherMapZoneKpis,
    incidents: dispatcherIncidents,
    revenue: dispatcherRevenue,
    topDrivers: dispatcherTopDrivers,
    analytics: dispatcherAnalytics,
    degraded: true,
  };
}
