import { useState, useEffect, useCallback } from 'react';
import { fetchIntegrationsBundle, invalidateIntegrationsCache } from '../lib/admin/integrations-api';
import type { IntegrationsDashboardSummary } from '../lib/admin/integrations-types';

export default function useIntegrationsCenter() {
  const [data, setData] = useState<IntegrationsDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchIntegrationsBundle()); }
    catch { setError('Impossible de charger les intégrations.'); }
    finally { setLoading(false); }
  }, []);

  const refresh = useCallback(async () => { invalidateIntegrationsCache(); await loadData(); }, [loadData]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { setLoading(false); setError('Session requise.'); return; }
    loadData();
  }, [loadData]);

  return {
    ...data,
    kpis: data?.kpis ?? null,
    apiKeys: data?.apiKeys ?? [],
    webhooks: data?.webhooks ?? [],
    webhookDeliveries: data?.webhookDeliveries ?? [],
    tracking: data?.tracking ?? [],
    serverSideTracking: data?.serverSideTracking ?? null,
    integrations: data?.integrations ?? [],
    logs: data?.logs ?? [],
    analytics: data?.analytics ?? [],
    eventDistribution: data?.eventDistribution ?? [],
    topEndpoints: data?.topEndpoints ?? [],
    security: data?.security ?? null,
    alerts: data?.alerts ?? [],
    openapi: data?.openapi ?? null,
    loading, error, refresh,
  };
}
