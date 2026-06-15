import { useState, useEffect, useCallback } from 'react';
import { fetchSmsBundle, invalidateSmsCache, exportSms, sendSms } from '../lib/admin/sms-api';
import type { SmsDashboardSummary } from '../lib/admin/sms-types';

export default function useSmsCenter() {
  const [data, setData] = useState<SmsDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchSmsBundle()); }
    catch { setError('Impossible de charger les données SMS.'); }
    finally { setLoading(false); }
  }, []);

  const refresh = useCallback(async () => { invalidateSmsCache(); await loadData(); }, [loadData]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { setLoading(false); setError('Session requise.'); return; }
    loadData();
  }, [loadData]);

  return {
    ...data,
    kpis: data?.kpis ?? null,
    operatorDistribution: data?.operatorDistribution ?? [],
    messages: data?.messages ?? [],
    operatorPerformance: data?.operatorPerformance ?? [],
    deliveryStatus: data?.deliveryStatus ?? [],
    campaigns: data?.campaigns ?? [],
    templates: data?.templates ?? [],
    senders: data?.senders ?? [],
    credits: data?.credits ?? null,
    creditLedger: data?.creditLedger ?? [],
    otpKpis: data?.otpKpis ?? null,
    otpRecords: data?.otpRecords ?? [],
    alerts: data?.alerts ?? [],
    analytics: data?.analytics ?? [],
    activities: data?.activities ?? [],
    webhooks: data?.webhooks ?? [],
    settings: data?.settings ?? null,
    logs: data?.logs ?? [],
    loading, error, refresh,
    handleExport: (format?: string) => exportSms(format),
    handleSend: (phone: string, message: string) => sendSms(phone, message),
  };
}
