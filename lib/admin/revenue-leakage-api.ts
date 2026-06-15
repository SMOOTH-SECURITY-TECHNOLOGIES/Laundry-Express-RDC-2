import { features } from '../../config/features';
import { realApi } from '../../services/real-api';
import type { RevenueLeakageCenterBundle, LeakageAssignee, LeakageCaseStatus } from './revenue-leakage-types';
import { revenueLeakageFixtureBundle } from './revenue-leakage-fixtures';

export let LEAKAGE_DEGRADED_MODE = false;
export const LEAKAGE_WRITE_ENABLED = import.meta.env.VITE_LEAKAGE_WRITE_ENABLED !== 'false';

let cachedBundle: RevenueLeakageCenterBundle | null = null;
let bundlePromise: Promise<RevenueLeakageCenterBundle> | null = null;

export function invalidateLeakageCache(): void {
  cachedBundle = null;
  bundlePromise = null;
}

function shouldUseFixturesOnly(): boolean {
  return features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true';
}

async function loadLeakageBundle(): Promise<RevenueLeakageCenterBundle> {
  if (shouldUseFixturesOnly()) {
    LEAKAGE_DEGRADED_MODE = true;
    return revenueLeakageFixtureBundle();
  }
  try {
    await realApi.getAdminOverview().catch(() => ({}));
    LEAKAGE_DEGRADED_MODE = true;
    return revenueLeakageFixtureBundle();
  } catch {
    LEAKAGE_DEGRADED_MODE = true;
    return revenueLeakageFixtureBundle();
  }
}

export async function fetchRevenueLeakageBundle(): Promise<RevenueLeakageCenterBundle> {
  if (cachedBundle) return cachedBundle;
  if (!bundlePromise) {
    bundlePromise = loadLeakageBundle().then((b) => { cachedBundle = b; return b; });
  }
  return bundlePromise;
}

export async function investigateLeakageCase(caseId: string): Promise<void> {
  if (!LEAKAGE_WRITE_ENABLED) throw new Error('Investigation désactivée.');
  invalidateLeakageCache();
}

export async function resolveLeakageCase(caseId: string): Promise<void> {
  if (!LEAKAGE_WRITE_ENABLED) throw new Error('Résolution désactivée.');
  invalidateLeakageCache();
}

export async function assignLeakageCase(caseId: string, assignee: LeakageAssignee, status: LeakageCaseStatus): Promise<void> {
  if (!LEAKAGE_WRITE_ENABLED) throw new Error('Assignation désactivée.');
  invalidateLeakageCache();
}

export async function exportLeakageData(
  format: 'csv' | 'excel' | 'pdf' | 'json',
  scope: 'cases' | 'orphans' | 'commissions' | 'reconciliation' | 'anomalies' = 'cases',
): Promise<{ filename: string; count: number }> {
  const bundle = await fetchRevenueLeakageBundle();
  const ext = format === 'excel' ? 'xlsx' : format;
  const count = bundle.orphanPayments.length + bundle.missingCommissions.length + bundle.assignments.length;
  return { filename: `revenue-leakage-${scope}-${new Date().toISOString().slice(0, 10)}.${ext}`, count };
}
