import { features } from '../../config/features';
import { realApi } from '../../services/real-api';
import type { CreateZonePayload, ZonesCenterBundle } from './zones-types';
import {
  zonesFixtureBundle,
  zoneDistribution,
  zoneEtaAnalytics,
  zoneAlerts,
  zoneHeatmap,
  zoneDispatcherSnapshots,
  zoneTruthAnomalies,
  zoneSlaSummary,
  zoneKpis,
  fixtureZones,
} from './zones-fixtures';

export let ZONES_DEGRADED_MODE = false;
export const ZONES_WRITE_ENABLED = import.meta.env.VITE_ZONES_WRITE_ENABLED !== 'false';

let cachedBundle: ZonesCenterBundle | null = null;
let bundlePromise: Promise<ZonesCenterBundle> | null = null;

export function invalidateZonesCache(): void {
  cachedBundle = null;
  bundlePromise = null;
}

function shouldUseFixturesOnly(): boolean {
  return features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true';
}

async function loadZonesBundle(): Promise<ZonesCenterBundle> {
  if (shouldUseFixturesOnly()) {
    ZONES_DEGRADED_MODE = true;
    return zonesFixtureBundle();
  }

  try {
    const [overview, tasksResponse, driversResponse] = await Promise.all([
      realApi.getAdminOverview().catch(() => ({})),
      realApi.getLogisticsTasks({ page: 1, page_size: 200 }),
      realApi.getLogisticsDrivers({ page: 1, page_size: 100 }),
    ]);

    const tasks = tasksResponse.tasks ?? [];
    const drivers = driversResponse.drivers ?? [];

    if (tasks.length === 0 && drivers.length === 0) {
      ZONES_DEGRADED_MODE = true;
      return zonesFixtureBundle();
    }

    ZONES_DEGRADED_MODE = false;
    const fixture = zonesFixtureBundle();
    const ov = overview as Record<string, number>;

    return {
      ...fixture,
      kpis: {
        ...zoneKpis,
        ordersPerDay: ov.total_orders_today ?? zoneKpis.ordersPerDay,
        revenuePerDay: ov.revenue_today ?? zoneKpis.revenuePerDay,
      },
      zones: fixtureZones,
      degraded: false,
    };
  } catch {
    ZONES_DEGRADED_MODE = true;
    return zonesFixtureBundle();
  }
}

export async function fetchZonesBundle(): Promise<ZonesCenterBundle> {
  if (cachedBundle) return cachedBundle;
  if (!bundlePromise) {
    bundlePromise = loadZonesBundle().then((b) => { cachedBundle = b; return b; });
  }
  return bundlePromise;
}

export async function createZone(payload: CreateZonePayload): Promise<void> {
  if (!ZONES_WRITE_ENABLED) throw new Error('Création zone désactivée.');
  invalidateZonesCache();
}

export async function updateZoneTariff(zoneId: string): Promise<void> {
  if (!ZONES_WRITE_ENABLED) throw new Error('Modification tarifs désactivée.');
  invalidateZonesCache();
}

export async function deleteZone(zoneId: string): Promise<void> {
  if (!ZONES_WRITE_ENABLED) throw new Error('Suppression zone désactivée.');
  invalidateZonesCache();
}

export async function exportZonesData(format: 'csv' | 'excel' | 'pdf'): Promise<{ filename: string; count: number }> {
  const bundle = await fetchZonesBundle();
  const ext = format === 'excel' ? 'xlsx' : format;
  return { filename: `zones-export-${new Date().toISOString().slice(0, 10)}.${ext}`, count: bundle.zones.length };
}
