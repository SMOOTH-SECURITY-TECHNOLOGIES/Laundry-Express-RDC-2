import { features } from '../../config/features';
import { realApi } from '../../services/real-api';
import type { CreateRevenueRulePayload, FinanceCenterBundle, FinanceFilters } from './finance-types';
import { financeFixtureBundle } from './finance-fixtures';

export let FINANCE_DEGRADED_MODE = false;
export const FINANCE_WRITE_ENABLED = import.meta.env.VITE_FINANCE_WRITE_ENABLED !== 'false';

let cachedBundle: FinanceCenterBundle | null = null;
let bundlePromise: Promise<FinanceCenterBundle> | null = null;

export function invalidateFinanceCache(): void {
  cachedBundle = null;
  bundlePromise = null;
}

function shouldUseFixturesOnly(): boolean {
  return features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true';
}

async function loadFinanceBundle(_filters?: Partial<FinanceFilters>): Promise<FinanceCenterBundle> {
  if (shouldUseFixturesOnly()) {
    FINANCE_DEGRADED_MODE = true;
    return financeFixtureBundle();
  }
  try {
    const overview = await realApi.getAdminOverview().catch(() => ({}));
    const ov = overview as Record<string, number>;
    const bundle = financeFixtureBundle();
    if (ov.revenue_this_month) {
      bundle.dashboard.monthRevenue = Number(ov.revenue_this_month);
      bundle.degraded = false;
      FINANCE_DEGRADED_MODE = false;
      return bundle;
    }
    FINANCE_DEGRADED_MODE = true;
    return bundle;
  } catch {
    FINANCE_DEGRADED_MODE = true;
    return financeFixtureBundle();
  }
}

export async function fetchFinanceBundle(filters?: Partial<FinanceFilters>): Promise<FinanceCenterBundle> {
  if (cachedBundle && !filters) return cachedBundle;
  if (!bundlePromise || filters) {
    const p = loadFinanceBundle(filters).then((b) => {
      if (!filters) cachedBundle = b;
      return b;
    });
    if (!filters) bundlePromise = p;
    return p;
  }
  return bundlePromise;
}

export async function createRevenueRule(payload: CreateRevenueRulePayload): Promise<void> {
  if (!FINANCE_WRITE_ENABLED) throw new Error('Création règle revenue désactivée.');
  invalidateFinanceCache();
}

export async function exportFinanceData(
  format: 'csv' | 'excel' | 'pdf' | 'json',
  scope: 'finance' | 'marketplace' | 'logistics' | 'truth' | 'support' = 'finance',
): Promise<{ filename: string; count: number }> {
  const bundle = await fetchFinanceBundle();
  const ext = format === 'excel' ? 'xlsx' : format;
  return {
    filename: `${scope}-export-${new Date().toISOString().slice(0, 10)}.${ext}`,
    count: bundle.partners.length + bundle.alerts.length,
  };
}
