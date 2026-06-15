import { features } from '../../config/features';
import { realApi } from '../../services/real-api';
import type { CommissionsCenterBundle, CreateCommissionRulePayload, UpdateCommissionRulePayload } from './commissions-types';
import { commissionsFixtureBundle } from './commissions-fixtures';

export let COMMISSIONS_DEGRADED_MODE = false;
export const COMMISSIONS_WRITE_ENABLED = import.meta.env.VITE_COMMISSIONS_WRITE_ENABLED !== 'false';

let cachedBundle: CommissionsCenterBundle | null = null;
let bundlePromise: Promise<CommissionsCenterBundle> | null = null;

export function invalidateCommissionsCache(): void {
  cachedBundle = null;
  bundlePromise = null;
}

function shouldUseFixturesOnly(): boolean {
  return features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true';
}

async function loadCommissionsBundle(): Promise<CommissionsCenterBundle> {
  if (shouldUseFixturesOnly()) {
    COMMISSIONS_DEGRADED_MODE = true;
    return commissionsFixtureBundle();
  }
  try {
    const overview = await realApi.getAdminOverview().catch(() => ({}));
    const ov = overview as Record<string, number>;
    const bundle = commissionsFixtureBundle();
    if (ov.commission_due) {
      bundle.kpis.due = Number(ov.commission_due);
      bundle.degraded = false;
      COMMISSIONS_DEGRADED_MODE = false;
      return bundle;
    }
    COMMISSIONS_DEGRADED_MODE = true;
    return bundle;
  } catch {
    COMMISSIONS_DEGRADED_MODE = true;
    return commissionsFixtureBundle();
  }
}

export async function fetchCommissionsBundle(): Promise<CommissionsCenterBundle> {
  if (cachedBundle) return cachedBundle;
  if (!bundlePromise) {
    bundlePromise = loadCommissionsBundle().then((b) => { cachedBundle = b; return b; });
  }
  return bundlePromise;
}

export async function updateCommissionRule(payload: UpdateCommissionRulePayload): Promise<void> {
  if (!COMMISSIONS_WRITE_ENABLED) throw new Error('Mise à jour règle commission désactivée.');
  invalidateCommissionsCache();
}

export async function createCommissionRule(payload: CreateCommissionRulePayload): Promise<void> {
  if (!COMMISSIONS_WRITE_ENABLED) throw new Error('Création règle commission désactivée.');
  invalidateCommissionsCache();
}

export async function exportCommissionsData(
  format: 'csv' | 'excel' | 'pdf' | 'json',
  scope: 'partner' | 'period' | 'service' | 'zone' | 'status' = 'partner',
): Promise<{ filename: string; count: number }> {
  const bundle = await fetchCommissionsBundle();
  const ext = format === 'excel' ? 'xlsx' : format;
  return {
    filename: `commissions-${scope}-${new Date().toISOString().slice(0, 10)}.${ext}`,
    count: bundle.partners.length + bundle.alerts.length,
  };
}
