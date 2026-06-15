import { useState, useEffect, useCallback } from 'react';
import {
  fetchPaymentGatewaysBundle, invalidatePaymentGatewaysCache,
  exportPaymentGateways, runReconciliation, testWebhook,
} from '../lib/admin/payment-gateways-api';
import type { PaymentGatewaysDashboardSummary } from '../lib/admin/payment-gateways-types';

export default function usePaymentGatewaysCenter(initialDays = 30) {
  const [data, setData] = useState<PaymentGatewaysDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchPaymentGatewaysBundle(initialDays)); }
    catch { setError('Impossible de charger les données.'); }
    finally { setLoading(false); }
  }, [initialDays]);

  const refresh = useCallback(async () => {
    invalidatePaymentGatewaysCache();
    await loadData();
  }, [loadData]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { setLoading(false); setError('Session requise.'); return; }
    loadData();
  }, [loadData]);

  return {
    ...data,
    kpis: data?.kpis ?? null,
    gateways: data?.gateways ?? [],
    revenueDistribution: data?.revenueDistribution ?? [],
    channelPerformance: data?.channelPerformance ?? [],
    transactions: data?.transactions ?? [],
    cashFlow: data?.cashFlow ?? null,
    commissions: data?.commissions ?? null,
    incidents: data?.incidents ?? [],
    successRateTrend: data?.successRateTrend ?? [],
    topPartners: data?.topPartners ?? [],
    settlements: data?.settlements ?? [],
    webhooks: data?.webhooks ?? [],
    reconciliations: data?.reconciliations ?? [],
    providerHealth: data?.providerHealth ?? [],
    refunds: data?.refunds ?? [],
    fraud: data?.fraud ?? null,
    loading, error, refresh,
    handleExport: (format?: string) => exportPaymentGateways(format),
    handleReconciliation: () => runReconciliation(),
    handleTestWebhook: (slug: string) => testWebhook(slug),
  };
}
