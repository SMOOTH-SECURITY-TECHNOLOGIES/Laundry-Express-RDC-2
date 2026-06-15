import { useState, useEffect, useCallback } from 'react';
import { fetchEmailBundle, invalidateEmailCache, exportEmail } from '../lib/admin/email-api';
import type { EmailDashboardSummary } from '../lib/admin/email-types';

export default function useEmailCenter() {
  const [data, setData] = useState<EmailDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchEmailBundle()); }
    catch { setError('Impossible de charger les données Email.'); }
    finally { setLoading(false); }
  }, []);

  const refresh = useCallback(async () => { invalidateEmailCache(); await loadData(); }, [loadData]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { setLoading(false); setError('Session requise.'); return; }
    loadData();
  }, [loadData]);

  return {
    ...data,
    kpis: data?.kpis ?? null,
    messages: data?.messages ?? [],
    templates: data?.templates ?? [],
    campaigns: data?.campaigns ?? [],
    automations: data?.automations ?? [],
    typeDistribution: data?.typeDistribution ?? [],
    domainPerformance: data?.domainPerformance ?? [],
    deliverability: data?.deliverability ?? [],
    bounces: data?.bounces ?? [],
    unsubscribeSummary: data?.unsubscribeSummary ?? null,
    unsubscribes: data?.unsubscribes ?? [],
    invoiceSummary: data?.invoiceSummary ?? null,
    invoices: data?.invoices ?? [],
    webhooks: data?.webhooks ?? [],
    alerts: data?.alerts ?? [],
    analytics: data?.analytics ?? [],
    segments: data?.segments ?? [],
    settings: data?.settings ?? null,
    loading, error, refresh,
    handleExport: (format?: string) => exportEmail(format),
  };
}
