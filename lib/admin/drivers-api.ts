import { features } from '../../config/features';
import { realApi } from '../../services/real-api';
import type { AddDriverPayload, DriversCenterBundle } from './drivers-types';
import {
  driversFixtureBundle,
  driverIncidents,
  driverRewards,
  driverWatchList,
  driverZoneAvailability,
  driverRevenueTrend,
  driverActivity,
} from './drivers-fixtures';
import {
  mapDriversToHealth,
  mapDriversToKpis,
  mapDriversToMapPoints,
  mapDriversToRanking,
  mapDriversToSla,
  mapLogisticsDriverToDriver,
} from './drivers-mappers';

export let DRIVERS_DEGRADED_MODE = false;
export const DRIVERS_WRITE_ENABLED = import.meta.env.VITE_DRIVERS_WRITE_ENABLED !== 'false';

let cachedBundle: DriversCenterBundle | null = null;
let bundlePromise: Promise<DriversCenterBundle> | null = null;

export function invalidateDriversCache(): void {
  cachedBundle = null;
  bundlePromise = null;
}

function shouldUseFixturesOnly(): boolean {
  return features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true';
}

async function loadDriversBundle(): Promise<DriversCenterBundle> {
  if (shouldUseFixturesOnly()) {
    DRIVERS_DEGRADED_MODE = true;
    return driversFixtureBundle();
  }

  try {
    const [driversResponse, tasksResponse] = await Promise.all([
      realApi.getLogisticsDrivers({ page: 1, page_size: 200 }),
      realApi.getLogisticsTasks({ page: 1, page_size: 200 }),
    ]);

    const rawDrivers = driversResponse.drivers ?? [];
    const tasks = tasksResponse.tasks ?? [];
    const activeDriverIds = new Set(
      tasks
        .filter((t) => ['driver_assigned', 'accepted', 'in_progress'].includes(t.status))
        .map((t) => t.driver_id)
    );
    const missionCounts = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.driver_id) missionCounts.set(t.driver_id, (missionCounts.get(t.driver_id) ?? 0) + 1);
    });

    const drivers = rawDrivers.map((d) =>
      mapLogisticsDriverToDriver(d, activeDriverIds.has(d.id), missionCounts.get(d.id) ?? 0)
    );

    if (drivers.length === 0) {
      DRIVERS_DEGRADED_MODE = true;
      return driversFixtureBundle();
    }

    DRIVERS_DEGRADED_MODE = false;
    const fixture = driversFixtureBundle();

    return {
      kpis: mapDriversToKpis(drivers),
      drivers,
      health: mapDriversToHealth(drivers),
      mapPoints: mapDriversToMapPoints(drivers).length > 0 ? mapDriversToMapPoints(drivers) : fixture.mapPoints,
      ranking: mapDriversToRanking(drivers),
      sla: mapDriversToSla(drivers),
      incidents: driverIncidents,
      rewards: driverRewards,
      watchList: driverWatchList,
      zoneAvailability: driverZoneAvailability,
      revenueTrend: driverRevenueTrend,
      activity: driverActivity,
      degraded: false,
    };
  } catch {
    DRIVERS_DEGRADED_MODE = true;
    return driversFixtureBundle();
  }
}

export async function fetchDriversBundle(): Promise<DriversCenterBundle> {
  if (cachedBundle) return cachedBundle;
  if (!bundlePromise) {
    bundlePromise = loadDriversBundle().then((bundle) => {
      cachedBundle = bundle;
      return bundle;
    });
  }
  return bundlePromise;
}

export async function addDriver(payload: AddDriverPayload): Promise<void> {
  if (!DRIVERS_WRITE_ENABLED) {
    throw new Error('Ajout chauffeur désactivé en mode lecture seule.');
  }
  invalidateDriversCache();
}

export async function suspendDriver(driverId: string): Promise<void> {
  if (!DRIVERS_WRITE_ENABLED) throw new Error('Suspension désactivée.');
  invalidateDriversCache();
}

export async function exportDriversData(format: 'csv' | 'excel' | 'pdf'): Promise<{ filename: string; count: number }> {
  const bundle = await fetchDriversBundle();
  const ext = format === 'excel' ? 'xlsx' : format;
  return { filename: `chauffeurs-export-${new Date().toISOString().slice(0, 10)}.${ext}`, count: bundle.drivers.length };
}
