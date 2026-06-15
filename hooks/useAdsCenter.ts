import { useState, useEffect, useCallback } from 'react';
import {
  fetchAdsBundle, invalidateAdsCache, pauseAd, archiveAd, duplicateAd,
  createAd, createCampaign, exportAdsData,
} from '../lib/admin/ads-api';
import type {
  AdsKpis, AdRow, FunnelStep, ChannelPerformance, ZonePerformance, AdCampaign,
  AdSegment, ReactivationStats, AbTest, TopAd, AdInsight, TruthAnomaly,
  AttributionMetrics, AdCreatePayload,
} from '../lib/admin/ads-types';

interface UseAdsCenterReturn {
  kpis: AdsKpis | null;
  ads: AdRow[];
  funnel: FunnelStep[];
  channels: ChannelPerformance[];
  zones: ZonePerformance[];
  campaigns: AdCampaign[];
  segments: AdSegment[];
  reactivation: ReactivationStats | null;
  abTests: AbTest[];
  topAds: TopAd[];
  insights: AdInsight[];
  truthAnomalies: TruthAnomaly[];
  attribution: AttributionMetrics | null;
  loading: boolean;
  error: string | null;
  source: string;
  refresh: (days?: number) => Promise<void>;
  handlePause: (id: string) => Promise<void>;
  handleArchive: (id: string) => Promise<void>;
  handleDuplicate: (id: string) => Promise<{ id: string }>;
  handleCreate: (payload: AdCreatePayload) => Promise<{ id: string }>;
  handleCreateCampaign: (name: string, objective: string, budget: number) => Promise<{ id: string }>;
  handleExport: (format: 'csv' | 'excel' | 'pdf' | 'json', scope?: 'campaigns' | 'performances' | 'roi' | 'segments' | 'attribution') => Promise<{ filename: string; count: number }>;
}

export default function useAdsCenter(initialDays = 7): UseAdsCenterReturn {
  const [kpis, setKpis] = useState<AdsKpis | null>(null);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [channels, setChannels] = useState<ChannelPerformance[]>([]);
  const [zones, setZones] = useState<ZonePerformance[]>([]);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [segments, setSegments] = useState<AdSegment[]>([]);
  const [reactivation, setReactivation] = useState<ReactivationStats | null>(null);
  const [abTests, setAbTests] = useState<AbTest[]>([]);
  const [topAds, setTopAds] = useState<TopAd[]>([]);
  const [insights, setInsights] = useState<AdInsight[]>([]);
  const [truthAnomalies, setTruthAnomalies] = useState<TruthAnomaly[]>([]);
  const [attribution, setAttribution] = useState<AttributionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('backend');
  const [days, setDays] = useState(initialDays);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchAdsBundle>>) => {
    setKpis(bundle.kpis);
    setAds(bundle.ads);
    setFunnel(bundle.funnel);
    setChannels(bundle.channels);
    setZones(bundle.zones);
    setCampaigns(bundle.campaigns);
    setSegments(bundle.segments);
    setReactivation(bundle.reactivation);
    setAbTests(bundle.abTests);
    setTopAds(bundle.topAds);
    setInsights(bundle.insights);
    setTruthAnomalies(bundle.truthAnomalies);
    setAttribution(bundle.attribution);
    setSource(bundle.source);
  }, []);

  const loadData = useCallback(async (d = days) => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await fetchAdsBundle(d);
      applyBundle(bundle);
    } catch {
      setError('Impossible de charger l\'Advertising Intelligence Center.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle, days]);

  const refresh = useCallback(async (d?: number) => {
    if (d !== undefined) setDays(d);
    invalidateAdsCache();
    await loadData(d ?? days);
  }, [loadData, days]);

  useEffect(() => { loadData(initialDays); }, [loadData, initialDays]);

  const reload = useCallback(async () => {
    invalidateAdsCache();
    await loadData();
  }, [loadData]);

  return {
    kpis, ads, funnel, channels, zones, campaigns, segments, reactivation,
    abTests, topAds, insights, truthAnomalies, attribution,
    loading, error, source,
    refresh,
    handlePause: async (id) => { await pauseAd(id); await reload(); },
    handleArchive: async (id) => { await archiveAd(id); await reload(); },
    handleDuplicate: async (id) => { const r = await duplicateAd(id); await reload(); return r; },
    handleCreate: async (payload) => {
      const r = await createAd(payload);
      await reload();
      return r;
    },
    handleCreateCampaign: async (name, objective, budget) => {
      const r = await createCampaign(name, objective, budget);
      await reload();
      return r;
    },
    handleExport: exportAdsData,
  };
}
