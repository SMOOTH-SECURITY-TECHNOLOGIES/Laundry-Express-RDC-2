import { computeDriverScore } from './drivers-scoring';
import type {
  Driver,
  DriverHealthOverview,
  DriverKpis,
  DriverMapPoint,
  DriverRankingEntry,
  DriverSlaData,
  DriverStatus,
} from './drivers-types';
import { defaultAvailability, defaultDocs, defaultHistory, fixtureDrivers } from './drivers-fixtures';

interface LogisticsDriverLike {
  id?: string;
  user_name?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
  vehicle_type?: string | null;
  license_number?: string | null;
  status?: string;
  is_available?: boolean;
  rating_avg?: number | string;
  rating_count?: number;
  created_at?: string;
  lat?: number;
  lng?: number;
  zone?: string;
}

const STATUS_MAP: Record<string, { status: DriverStatus; label: string; color: string }> = {
  available: { status: 'available', label: 'Disponible', color: 'bg-green-100 text-green-700' },
  on_mission: { status: 'on_mission', label: 'En mission', color: 'bg-blue-100 text-blue-700' },
  pause: { status: 'pause', label: 'Pause', color: 'bg-orange-100 text-orange-700' },
  offline: { status: 'offline', label: 'Offline', color: 'bg-gray-100 text-gray-600' },
  suspended: { status: 'suspended', label: 'Suspendu', color: 'bg-red-100 text-red-700' },
  active: { status: 'available', label: 'Disponible', color: 'bg-green-100 text-green-700' },
  inactive: { status: 'offline', label: 'Offline', color: 'bg-gray-100 text-gray-600' },
};

function mapDriverStatus(raw: LogisticsDriverLike, onMission: boolean): { status: DriverStatus; label: string; color: string } {
  if (raw.status === 'suspended') return STATUS_MAP.suspended;
  if (onMission) return STATUS_MAP.on_mission;
  if (raw.is_available) return STATUS_MAP.available;
  if (raw.status === 'inactive') return STATUS_MAP.offline;
  return STATUS_MAP.offline;
}

export function mapLogisticsDriverToDriver(
  raw: LogisticsDriverLike,
  onMission = false,
  missionCount = 0
): Driver {
  const name = raw.user_name ?? raw.user_email ?? 'Chauffeur';
  const mapped = mapDriverStatus(raw, onMission);
  const rating = typeof raw.rating_avg === 'string' ? parseFloat(raw.rating_avg) : (raw.rating_avg ?? 4.5);
  const sla = Math.min(99, Math.round(85 + rating * 3));
  const scoreTotal = computeDriverScore({ sla, rating, punctuality: 88, acceptance: 85, incidentPenalty: 5 });

  const template = fixtureDrivers[0];
  return {
    id: raw.id ?? '',
    name,
    phone: raw.user_phone ?? '—',
    email: raw.user_email ?? '—',
    address: 'Kinshasa, RDC',
    photoInitials: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
    photoColor: 'bg-indigo-100 text-indigo-700',
    partner: 'Laundry Express Logistique',
    zone: raw.zone ?? 'Gombe',
    vehicle: {
      type: (raw.vehicle_type as 'Moto' | 'Voiture' | 'Camionnette') ?? 'Moto',
      plate: raw.license_number ?? '—',
      icon: 'truck',
    },
    status: mapped.status,
    statusLabel: mapped.label,
    statusColor: mapped.color,
    missions: missionCount || raw.rating_count || 0,
    sla,
    rating: +rating.toFixed(1),
    revenue: Math.round(missionCount * 85 + 500),
    score: { total: scoreTotal, sla, rating: rating * 20, punctuality: 88, acceptance: 85, incidents: 90 },
    performance: template.performance,
    documents: defaultDocs(),
    location: raw.lat != null && raw.lng != null
      ? { lat: raw.lat, lng: raw.lng, zone: raw.zone ?? 'Gombe', updatedAt: 'récent' }
      : null,
    registeredAt: raw.created_at ? new Date(raw.created_at).toLocaleDateString('fr-FR') : '—',
    badges: scoreTotal >= 90 ? ['Top Driver'] : [],
    missionHistory: defaultHistory(),
    availability: defaultAvailability(),
  };
}

export function mapDriversToKpis(drivers: Driver[]): DriverKpis {
  const available = drivers.filter((d) => d.status === 'available').length;
  const onMission = drivers.filter((d) => d.status === 'on_mission').length;
  const offline = drivers.filter((d) => d.status === 'offline').length;
  const avgSla = drivers.length ? Math.round(drivers.reduce((s, d) => s + d.sla, 0) / drivers.length) : 94;
  const avgRating = drivers.length ? +(drivers.reduce((s, d) => s + d.rating, 0) / drivers.length).toFixed(1) : 4.8;
  const totalRevenue = drivers.reduce((s, d) => s + d.revenue, 0);
  const openIncidents = drivers.filter((d) => d.performance.incidents > 2).length;

  return {
    registered: drivers.length || 32,
    available: available || 18,
    onMission: onMission || 11,
    offline: offline || 3,
    avgSla,
    avgRating,
    totalRevenue: totalRevenue || 12450,
    openIncidents: openIncidents || 2,
  };
}

export function mapDriversToHealth(drivers: Driver[]): DriverHealthOverview {
  const counts = { available: 0, busy: 0, pause: 0, offline: 0, suspended: 0 };
  drivers.forEach((d) => {
    if (d.status === 'available') counts.available += 1;
    else if (d.status === 'on_mission') counts.busy += 1;
    else if (d.status === 'pause') counts.pause += 1;
    else if (d.status === 'suspended') counts.suspended += 1;
    else counts.offline += 1;
  });
  const total = drivers.length || 1;
  return {
    ...counts,
    availablePercent: Math.round((counts.available / total) * 100),
    busyPercent: Math.round((counts.busy / total) * 100),
    pausePercent: Math.round((counts.pause / total) * 100),
    offlinePercent: Math.round((counts.offline / total) * 100),
    suspendedPercent: Math.round((counts.suspended / total) * 100),
  };
}

export function mapDriversToMapPoints(drivers: Driver[]): DriverMapPoint[] {
  return drivers
    .filter((d) => d.location)
    .map((d) => ({
      id: d.id,
      name: d.name,
      lat: d.location!.lat,
      lng: d.location!.lng,
      status: d.status,
    }));
}

export function mapDriversToRanking(drivers: Driver[]): DriverRankingEntry[] {
  return [...drivers]
    .sort((a, b) => b.score.total - a.score.total)
    .map((d) => ({ id: d.id, name: d.name, score: d.score.total, sla: d.sla, rating: d.rating, missions: d.missions }));
}

export function mapDriversToSla(drivers: Driver[]): DriverSlaData {
  const atRisk = drivers.filter((d) => d.sla < 90 && d.sla >= 80).length;
  const breached = drivers.filter((d) => d.sla < 80).length;
  const inSla = Math.max(0, drivers.length - atRisk - breached);
  const total = drivers.length || 100;
  return {
    inSla: inSla || 94,
    atRisk: atRisk || 12,
    breached: breached || 3,
    inSlaPercent: Math.round(((inSla || 94) / total) * 100),
    atRiskPercent: Math.round(((atRisk || 12) / total) * 100),
    breachedPercent: Math.round(((breached || 3) / total) * 100),
  };
}
