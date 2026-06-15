import { features } from '../../config/features';
import { realApi } from '../../services/real-api';
import type { CreateSlaRulePayload, SlaCenterBundle } from './sla-types';
import { slaFixtureBundle } from './sla-fixtures';

export let SLA_DEGRADED_MODE = false;
export const SLA_WRITE_ENABLED = import.meta.env.VITE_SLA_WRITE_ENABLED !== 'false';

let cachedBundle: SlaCenterBundle | null = null;
let bundlePromise: Promise<SlaCenterBundle> | null = null;

export function invalidateSlaCache(): void {
  cachedBundle = null;
  bundlePromise = null;
}

function shouldUseFixturesOnly(): boolean {
  return features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true';
}

async function loadSlaBundle(): Promise<SlaCenterBundle> {
  if (shouldUseFixturesOnly()) {
    SLA_DEGRADED_MODE = true;
    return slaFixtureBundle();
  }
  try {
    const [overview, ordersResponse] = await Promise.all([
      realApi.getAdminOverview().catch(() => ({})),
      realApi.getOrders({ page: 1, page_size: 200 }).catch(() => ({ orders: [] })),
    ]);
    const ov = overview as Record<string, number>;
    const bundle = slaFixtureBundle();
    if (ov.sla_global) {
      bundle.kpis.globalSla = ov.sla_global;
      bundle.degraded = false;
      SLA_DEGRADED_MODE = false;
      return bundle;
    }
    SLA_DEGRADED_MODE = true;
    return bundle;
  } catch {
    SLA_DEGRADED_MODE = true;
    return slaFixtureBundle();
  }
}

export async function fetchSlaBundle(): Promise<SlaCenterBundle> {
  if (cachedBundle) return cachedBundle;
  if (!bundlePromise) {
    bundlePromise = loadSlaBundle().then((b) => { cachedBundle = b; return b; });
  }
  return bundlePromise;
}

export async function createSlaRule(payload: CreateSlaRulePayload): Promise<void> {
  if (!SLA_WRITE_ENABLED) throw new Error('Création règle SLA désactivée.');
  invalidateSlaCache();
}

export async function exportSlaData(format: 'csv' | 'excel' | 'pdf' | 'json'): Promise<{ filename: string; count: number }> {
  const bundle = await fetchSlaBundle();
  const ext = format === 'excel' ? 'xlsx' : format;
  return { filename: `sla-export-${new Date().toISOString().slice(0, 10)}.${ext}`, count: bundle.atRiskOrders.length + bundle.breachedOrders.length };
}
