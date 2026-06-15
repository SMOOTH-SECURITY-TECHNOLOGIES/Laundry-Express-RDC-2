import { useState, useEffect, useCallback } from 'react';
import {
  fetchPromotionsBundle, invalidatePromotionsCache, createPromotion, updatePromotion,
  deletePromotion, pausePromotion, createCampaign, exportPromotionsData, PROMOTIONS_DEGRADED_MODE,
} from '../lib/admin/promotions-api';
import {
  connectPromotionsWebSocket, disconnectPromotionsWebSocket, subscribePromotionsWs, isPromotionsWsConnected,
} from '../lib/admin/promotions-websocket';
import type {
  PromoKpis, GrowthScore, ActivePromotion, PromoCampaign, PromoSegmentStats, ReactivationStats,
  LoyaltyWidget, ReferralWidget, PromoZoneStats, PromoFunnelStep, AttributionChannel, AbTestVariant,
  TopPromotion, RiskPromotion, PromoInsight, PromoCreatePayload,
} from '../lib/admin/promotions-types';

interface UsePromotionsCenterReturn {
  kpis: PromoKpis | null;
  growthScore: GrowthScore | null;
  activePromotions: ActivePromotion[];
  campaigns: PromoCampaign[];
  segments: PromoSegmentStats[];
  reactivation: ReactivationStats | null;
  loyalty: LoyaltyWidget | null;
  referral: ReferralWidget | null;
  zones: PromoZoneStats[];
  funnel: PromoFunnelStep[];
  attribution: AttributionChannel[];
  abTests: AbTestVariant[];
  topPromotions: TopPromotion[];
  riskPromotions: RiskPromotion[];
  insights: PromoInsight[];
  loading: boolean;
  error: string | null;
  degraded: boolean;
  wsConnected: boolean;
  refresh: () => Promise<void>;
  handleCreate: (payload: PromoCreatePayload) => Promise<{ id: string }>;
  handleUpdate: (id: string, payload: Partial<PromoCreatePayload>) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  handlePause: (id: string) => Promise<void>;
  handleCreateCampaign: (name: string, audience: string, budget: number) => Promise<{ id: string }>;
  handleExport: (format: 'csv' | 'excel' | 'pdf' | 'json', scope?: 'promotions' | 'roi' | 'campaigns' | 'coupons' | 'segments') => Promise<{ filename: string; count: number }>;
}

export default function usePromotionsCenter(): UsePromotionsCenterReturn {
  const [kpis, setKpis] = useState<PromoKpis | null>(null);
  const [growthScore, setGrowthScore] = useState<GrowthScore | null>(null);
  const [activePromotions, setActivePromotions] = useState<ActivePromotion[]>([]);
  const [campaigns, setCampaigns] = useState<PromoCampaign[]>([]);
  const [segments, setSegments] = useState<PromoSegmentStats[]>([]);
  const [reactivation, setReactivation] = useState<ReactivationStats | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyWidget | null>(null);
  const [referral, setReferral] = useState<ReferralWidget | null>(null);
  const [zones, setZones] = useState<PromoZoneStats[]>([]);
  const [funnel, setFunnel] = useState<PromoFunnelStep[]>([]);
  const [attribution, setAttribution] = useState<AttributionChannel[]>([]);
  const [abTests, setAbTests] = useState<AbTestVariant[]>([]);
  const [topPromotions, setTopPromotions] = useState<TopPromotion[]>([]);
  const [riskPromotions, setRiskPromotions] = useState<RiskPromotion[]>([]);
  const [insights, setInsights] = useState<PromoInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchPromotionsBundle>>) => {
    setKpis(bundle.kpis);
    setGrowthScore(bundle.growthScore);
    setActivePromotions(bundle.activePromotions);
    setCampaigns(bundle.campaigns);
    setSegments(bundle.segments);
    setReactivation(bundle.reactivation);
    setLoyalty(bundle.loyalty);
    setReferral(bundle.referral);
    setZones(bundle.zones);
    setFunnel(bundle.funnel);
    setAttribution(bundle.attribution);
    setAbTests(bundle.abTests);
    setTopPromotions(bundle.topPromotions);
    setRiskPromotions(bundle.riskPromotions);
    setInsights(bundle.insights);
    setDegraded(bundle.degraded || PROMOTIONS_DEGRADED_MODE);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await fetchPromotionsBundle();
      applyBundle(bundle);
    } catch {
      setError('Impossible de charger le Growth & Promotions Center.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle]);

  const refresh = useCallback(async () => {
    invalidatePromotionsCache();
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
    connectPromotionsWebSocket();
    const unsub = subscribePromotionsWs((ev) => {
      if (ev.type === 'promo_used') {
        setKpis((k) => k ? { ...k, usages: k.usages + 1, revenueGenerated: k.revenueGenerated + ev.revenue } : k);
      }
    });
    const wsPoll = setInterval(() => setWsConnected(isPromotionsWsConnected()), 3000);
    return () => { unsub(); disconnectPromotionsWebSocket(); clearInterval(wsPoll); };
  }, [loadData]);

  return {
    kpis, growthScore, activePromotions, campaigns, segments, reactivation, loyalty, referral,
    zones, funnel, attribution, abTests, topPromotions, riskPromotions, insights,
    loading, error, degraded, wsConnected, refresh,
    handleCreate: createPromotion,
    handleUpdate: updatePromotion,
    handleDelete: deletePromotion,
    handlePause: pausePromotion,
    handleCreateCampaign: createCampaign,
    handleExport: exportPromotionsData,
  };
}
