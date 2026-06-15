import { features } from '../../config/features';
import { realApi } from '../../services/real-api';
import type { PaymentsCenterBundle } from './payments-types';
import { paymentsFixtureBundle } from './payments-fixtures';

export let PAYMENTS_DEGRADED_MODE = false;
export const PAYMENTS_WRITE_ENABLED = import.meta.env.VITE_PAYMENTS_WRITE_ENABLED !== 'false';

let cachedBundle: PaymentsCenterBundle | null = null;
let bundlePromise: Promise<PaymentsCenterBundle> | null = null;

export function invalidatePaymentsCache(): void {
  cachedBundle = null;
  bundlePromise = null;
}

function shouldUseFixturesOnly(): boolean {
  return features.useMockApi || import.meta.env.VITE_USE_MOCK_API === 'true';
}

async function loadPaymentsBundle(): Promise<PaymentsCenterBundle> {
  if (shouldUseFixturesOnly()) {
    PAYMENTS_DEGRADED_MODE = true;
    return paymentsFixtureBundle();
  }
  try {
    await realApi.getAdminOverview().catch(() => ({}));
    PAYMENTS_DEGRADED_MODE = true;
    return paymentsFixtureBundle();
  } catch {
    PAYMENTS_DEGRADED_MODE = true;
    return paymentsFixtureBundle();
  }
}

export async function fetchPaymentsBundle(): Promise<PaymentsCenterBundle> {
  if (cachedBundle) return cachedBundle;
  if (!bundlePromise) {
    bundlePromise = loadPaymentsBundle().then((b) => { cachedBundle = b; return b; });
  }
  return bundlePromise;
}

export async function retryPayment(paymentId: string): Promise<void> {
  if (!PAYMENTS_WRITE_ENABLED) throw new Error('Relance paiement désactivée.');
  invalidatePaymentsCache();
}

export async function exportPaymentsData(
  format: 'csv' | 'excel' | 'pdf' | 'json',
  scope: 'transactions' | 'commissions' | 'refunds' | 'reconciliation' | 'anomalies' = 'transactions',
): Promise<{ filename: string; count: number }> {
  const bundle = await fetchPaymentsBundle();
  const ext = format === 'excel' ? 'xlsx' : format;
  return {
    filename: `payments-${scope}-${new Date().toISOString().slice(0, 10)}.${ext}`,
    count: bundle.transactions.length + bundle.failed.length,
  };
}
