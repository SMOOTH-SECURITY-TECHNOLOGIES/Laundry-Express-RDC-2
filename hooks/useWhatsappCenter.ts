import { useState, useEffect, useCallback } from 'react';
import {
  fetchWhatsappBundle, invalidateWhatsappCache, exportWhatsapp, testWhatsappWebhook, sendWhatsappMessage,
} from '../lib/admin/whatsapp-api';
import type { WhatsappDashboardSummary } from '../lib/admin/whatsapp-types';

export default function useWhatsappCenter() {
  const [data, setData] = useState<WhatsappDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchWhatsappBundle()); }
    catch { setError('Impossible de charger les données WhatsApp.'); }
    finally { setLoading(false); }
  }, []);

  const refresh = useCallback(async () => {
    invalidateWhatsappCache();
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
    conversations: data?.conversations ?? [],
    liveMonitor: data?.liveMonitor ?? null,
    templates: data?.templates ?? [],
    notifications: data?.notifications ?? [],
    campaigns: data?.campaigns ?? [],
    automations: data?.automations ?? [],
    webhooks: data?.webhooks ?? [],
    quality: data?.quality ?? null,
    aiMetrics: data?.aiMetrics ?? null,
    costs: data?.costs ?? null,
    analytics: data?.analytics ?? [],
    segments: data?.segments ?? [],
    sla: data?.sla ?? null,
    loading, error, refresh,
    handleExport: (format?: string) => exportWhatsapp(format),
    handleTestWebhook: () => testWhatsappWebhook(),
    handleSend: (phone: string, message: string) => sendWhatsappMessage(phone, message),
  };
}
