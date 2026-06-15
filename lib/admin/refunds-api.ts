import { features } from '../../config/features';
import { realApi } from '../../services/real-api';
import type { CreateRefundPolicyPayload, RefundsCenterBundle } from './refunds-types';
import { refundsFixtureBundle } from './refunds-fixtures';

export let REFUNDS_DEGRADED_MODE = false;
export const REFUNDS_WRITE_ENABLED = import.meta.env.VITE_REFUNDS_WRITE_ENABLED !== 'false';

let cachedBundle: RefundsCenterBundle | null = null;
let bundlePromise: Promise<RefundsCenterBundle> | null = null;

export function invalidateRefundsCache(): void {
  cachedBundle = null;
  bundlePromise = null;
}

function shouldUseFixturesOnly(): boolean {
  return features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true';
}

async function loadRefundsBundle(): Promise<RefundsCenterBundle> {
  if (shouldUseFixturesOnly()) {
    REFUNDS_DEGRADED_MODE = true;
    return refundsFixtureBundle();
  }
  try {
    await realApi.getAdminOverview().catch(() => ({}));
    REFUNDS_DEGRADED_MODE = true;
    return refundsFixtureBundle();
  } catch {
    REFUNDS_DEGRADED_MODE = true;
    return refundsFixtureBundle();
  }
}

export async function fetchRefundsBundle(): Promise<RefundsCenterBundle> {
  if (cachedBundle) return cachedBundle;
  if (!bundlePromise) {
    bundlePromise = loadRefundsBundle().then((b) => { cachedBundle = b; return b; });
  }
  return bundlePromise;
}

export async function approveRefund(refundId: string): Promise<void> {
  if (!REFUNDS_WRITE_ENABLED) throw new Error('Approbation remboursement désactivée.');
  invalidateRefundsCache();
}

export async function rejectRefund(refundId: string): Promise<void> {
  if (!REFUNDS_WRITE_ENABLED) throw new Error('Rejet remboursement désactivé.');
  invalidateRefundsCache();
}

export async function createRefundPolicy(payload: CreateRefundPolicyPayload): Promise<void> {
  if (!REFUNDS_WRITE_ENABLED) throw new Error('Création politique remboursement désactivée.');
  invalidateRefundsCache();
}

export async function exportRefundsData(
  format: 'csv' | 'excel' | 'pdf' | 'json',
  scope: 'period' | 'partner' | 'reason' | 'status' | 'zone' = 'period',
): Promise<{ filename: string; count: number }> {
  const bundle = await fetchRefundsBundle();
  const ext = format === 'excel' ? 'xlsx' : format;
  return {
    filename: `refunds-${scope}-${new Date().toISOString().slice(0, 10)}.${ext}`,
    count: bundle.requests.length + bundle.alerts.length,
  };
}
