import { features } from '../../config/features';
import { realApi } from '../../services/real-api';
import { computeDriverScore } from './dispatcher-scoring';
import type {
  AssignMissionPayload,
  AutoDispatchResult,
  DispatcherCenterBundle,
} from './dispatcher-types';
import {
  dispatcherFixtureBundle,
  dispatcherMapClusters,
  dispatcherMapZoneKpis,
  dispatcherIncidents,
} from './dispatcher-fixtures';
import {
  mapDispatcherAnalytics,
  mapDispatcherKpis,
  mapDispatcherSla,
  mapDriversToAvailable,
  mapDriversToMapPoints,
  mapDriverHealth,
  mapRevenueImpact,
  mapTasksToActive,
  mapTasksToBacklog,
  mapTopDrivers,
} from './dispatcher-mappers';

export let DISPATCHER_DEGRADED_MODE = false;
export const DISPATCHER_WRITE_ENABLED = import.meta.env.VITE_DISPATCHER_WRITE_ENABLED !== 'false';

let cachedBundle: DispatcherCenterBundle | null = null;
let bundlePromise: Promise<DispatcherCenterBundle> | null = null;

export function invalidateDispatcherCache(): void {
  cachedBundle = null;
  bundlePromise = null;
}

function shouldUseFixturesOnly(): boolean {
  return features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true';
}

async function loadDispatcherBundle(): Promise<DispatcherCenterBundle> {
  if (shouldUseFixturesOnly()) {
    DISPATCHER_DEGRADED_MODE = true;
    return dispatcherFixtureBundle();
  }

  try {
    const [tasksResponse, driversResponse, overview] = await Promise.all([
      realApi.getLogisticsTasks({ page: 1, page_size: 200 }),
      realApi.getLogisticsDrivers({ page: 1, page_size: 100 }),
      realApi.getAdminOverview().catch(() => ({})),
    ]);

    const tasks = (tasksResponse.tasks ?? []) as Parameters<typeof mapTasksToBacklog>[0];
    const drivers = (driversResponse.drivers ?? []) as Parameters<typeof mapDriversToAvailable>[0];

    const backlog = mapTasksToBacklog(tasks, drivers);
    const activeMissions = mapTasksToActive(tasks, drivers);
    const availableDrivers = mapDriversToAvailable(drivers);
    const driverHealth = mapDriverHealth(availableDrivers);
    const kpis = mapDispatcherKpis(backlog, activeMissions, availableDrivers, overview as Record<string, number>);
    const sla = mapDispatcherSla(activeMissions);
    const mapPoints = mapDriversToMapPoints(drivers);
    const revenue = mapRevenueImpact(overview as Record<string, number>);
    const topDrivers = mapTopDrivers(availableDrivers);
    const analytics = mapDispatcherAnalytics(activeMissions.length);

    DISPATCHER_DEGRADED_MODE = false;

    const fixture = dispatcherFixtureBundle();

    return {
      kpis: backlog.length > 0 || activeMissions.length > 0 ? kpis : fixture.kpis,
      backlog: backlog.length > 0 ? backlog : fixture.backlog,
      activeMissions: activeMissions.length > 0 ? activeMissions : fixture.activeMissions,
      drivers: availableDrivers.length > 0 ? availableDrivers : fixture.drivers,
      driverHealth: availableDrivers.length > 0 ? driverHealth : fixture.driverHealth,
      sla: activeMissions.length > 0 ? sla : fixture.sla,
      mapPoints: mapPoints.length > 0 ? mapPoints : fixture.mapPoints,
      mapClusters: dispatcherMapClusters,
      mapZoneKpis: dispatcherMapZoneKpis,
      incidents: dispatcherIncidents,
      revenue,
      topDrivers: topDrivers.length > 0 ? topDrivers : fixture.topDrivers,
      analytics,
      degraded: false,
    };
  } catch {
    DISPATCHER_DEGRADED_MODE = true;
    return dispatcherFixtureBundle();
  }
}

export async function fetchDispatcherBundle(): Promise<DispatcherCenterBundle> {
  if (cachedBundle) return cachedBundle;
  if (!bundlePromise) {
    bundlePromise = loadDispatcherBundle().then((bundle) => {
      cachedBundle = bundle;
      return bundle;
    });
  }
  return bundlePromise;
}

export async function assignMission(payload: AssignMissionPayload): Promise<void> {
  if (!DISPATCHER_WRITE_ENABLED) {
    throw new Error('Assignation désactivée en mode lecture seule.');
  }
  await realApi.assignLogisticsTask(payload.missionId, payload.driverId);
  invalidateDispatcherCache();
}

export async function autoDispatchMissions(): Promise<AutoDispatchResult> {
  const bundle = await fetchDispatcherBundle();
  const available = bundle.drivers.filter((d) => d.availability === 'available');
  const result: AutoDispatchResult = { assigned: 0, skipped: 0, details: [] };

  for (const mission of bundle.backlog) {
    const candidates = available
      .map((driver) => ({
        driver,
        score: computeDriverScore({
          distanceKm: driver.distanceKm,
          slaUrgency: 90,
          performanceHistory: driver.score,
          currentLoad: driver.activeMissions * 20,
          availability: 100,
        }),
      }))
      .sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (!best || best.score < 50) {
      result.skipped += 1;
      continue;
    }

    if (DISPATCHER_WRITE_ENABLED) {
      try {
        await realApi.assignLogisticsTask(mission.id, best.driver.id);
      } catch {
        result.skipped += 1;
        continue;
      }
    }

    result.assigned += 1;
    result.details.push({
      missionId: mission.id,
      driverId: best.driver.id,
      driverName: best.driver.name,
      score: best.score,
    });
  }

  invalidateDispatcherCache();
  return result;
}

export async function exportDispatcherData(format: 'csv' | 'excel' | 'pdf'): Promise<{ filename: string; count: number }> {
  const bundle = await fetchDispatcherBundle();
  const count = bundle.backlog.length + bundle.activeMissions.length;
  const ext = format === 'excel' ? 'xlsx' : format;
  return { filename: `dispatcher-export-${new Date().toISOString().slice(0, 10)}.${ext}`, count };
}
