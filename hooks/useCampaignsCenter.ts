import { useState, useEffect, useCallback } from 'react';
import {
  fetchCampaignsBundle, invalidateCampaignsCache, createCampaign, updateCampaign,
  deleteCampaign, pauseCampaign, resumeCampaign, duplicateCampaign,
  getCampaignAnalytics, exportCampaignsData,
} from '../lib/admin/campaigns-api';
import type {
  CampaignKpis, Campaign, CampaignChannelPerformance, CampaignFunnelStep,
  CampaignTrendPoint, CampaignSegment, CampaignAutomation, CampaignCalendarEvent,
  CampaignROI, CampaignWatchlistItem, CampaignAnalytics,
} from '../lib/admin/campaigns-types';

export default function useCampaignsCenter(initialDays = 7) {
  const [kpis, setKpis] = useState<CampaignKpis | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [channels, setChannels] = useState<CampaignChannelPerformance[]>([]);
  const [funnel, setFunnel] = useState<CampaignFunnelStep[]>([]);
  const [trends, setTrends] = useState<CampaignTrendPoint[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<CampaignSegment[]>([]);
  const [automations, setAutomations] = useState<CampaignAutomation[]>([]);
  const [calendar, setCalendar] = useState<CampaignCalendarEvent[]>([]);
  const [roi, setRoi] = useState<CampaignROI | null>(null);
  const [watchlist, setWatchlist] = useState<CampaignWatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('backend');
  const [days, setDays] = useState(initialDays);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchCampaignsBundle>>) => {
    setKpis(bundle.kpis);
    setCampaigns(bundle.campaigns);
    setChannels(bundle.channels);
    setFunnel(bundle.funnel);
    setTrends(bundle.trends);
    setTopCampaigns(bundle.topCampaigns);
    setSegments(bundle.segments);
    setAutomations(bundle.automations);
    setCalendar(bundle.calendar);
    setRoi(bundle.roi);
    setWatchlist(bundle.watchlist);
    setSource(bundle.source);
  }, []);

  const loadData = useCallback(async (d = days) => {
    setLoading(true);
    setError(null);
    try {
      applyBundle(await fetchCampaignsBundle(d));
    } catch {
      setError('Impossible de charger les campagnes.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle, days]);

  const refresh = useCallback(async (d?: number) => {
    if (d !== undefined) setDays(d);
    invalidateCampaignsCache();
    await loadData(d ?? days);
  }, [loadData, days]);

  const reload = useCallback(async () => {
    invalidateCampaignsCache();
    await loadData();
  }, [loadData]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setLoading(false);
      setError('Session requise. Reconnectez-vous en tant qu\'administrateur.');
      return;
    }
    loadData(initialDays);
  }, [loadData, initialDays]);

  return {
    kpis, campaigns, channels, funnel, trends, topCampaigns, segments,
    automations, calendar, roi, watchlist, loading, error, source, days, refresh,
    handleCreate: async (data: Parameters<typeof createCampaign>[0]) => { const r = await createCampaign(data); await reload(); return r; },
    handleUpdate: async (id: string, data: Record<string, unknown>) => { await updateCampaign(id, data); await reload(); },
    handleDelete: async (id: string) => { await deleteCampaign(id); await reload(); },
    handlePause: async (id: string) => { await pauseCampaign(id); await reload(); },
    handleResume: async (id: string) => { await resumeCampaign(id); await reload(); },
    handleDuplicate: async (id: string) => { const r = await duplicateCampaign(id); await reload(); return r; },
    handleAnalytics: async (id: string): Promise<CampaignAnalytics> => {
      const raw = await getCampaignAnalytics(id);
      return {
        campaignId: raw.campaign_id, name: raw.name, messagesSent: raw.messages_sent,
        opens: raw.opens, clicks: raw.clicks, conversions: raw.conversions,
        revenue: raw.revenue, roi: raw.roi, openRate: raw.open_rate,
        clickRate: raw.click_rate, conversionRate: raw.conversion_rate,
      };
    },
    handleExport: exportCampaignsData,
  };
}
