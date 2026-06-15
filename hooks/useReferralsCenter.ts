import { useState, useEffect, useCallback } from 'react';
import {
  fetchReferralsBundle, invalidateReferralsCache, saveReferralSettings,
  createReferralCampaign, sendManualBonus, exportReferralsData,
} from '../lib/admin/referrals-api';
import { realApi } from '../services/real-api';
import type {
  ReferralKpis, ReferralSettings, TopReferrer, ReferralConversion,
  ReferralWatchlistItem, ReferralChannelPerformance, ReferralTrendPoint,
  ReferralImpactMetric, PopularReferralCode,
} from '../lib/admin/referrals-types';

export default function useReferralsCenter(initialDays = 7) {
  const [kpis, setKpis] = useState<ReferralKpis | null>(null);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [channels, setChannels] = useState<ReferralChannelPerformance[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [recentConversions, setRecentConversions] = useState<ReferralConversion[]>([]);
  const [watchlist, setWatchlist] = useState<ReferralWatchlistItem[]>([]);
  const [trends, setTrends] = useState<ReferralTrendPoint[]>([]);
  const [impact, setImpact] = useState<ReferralImpactMetric[]>([]);
  const [popularCodes, setPopularCodes] = useState<PopularReferralCode[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('backend');
  const [days, setDays] = useState(initialDays);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchReferralsBundle>>) => {
    setKpis(bundle.kpis);
    setSettings(bundle.settings);
    setChannels(bundle.channels);
    setTopReferrers(bundle.topReferrers);
    setRecentConversions(bundle.recentConversions);
    setWatchlist(bundle.watchlist);
    setTrends(bundle.trends);
    setImpact(bundle.impact);
    setPopularCodes(bundle.popularCodes);
    setTotalRevenue(bundle.totalRevenue);
    setSource(bundle.source);
  }, []);

  const loadData = useCallback(async (d = days) => {
    setLoading(true);
    setError(null);
    try {
      applyBundle(await fetchReferralsBundle(d));
    } catch {
      setError('Impossible de charger les données de parrainage.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle, days]);

  const refresh = useCallback(async (d?: number) => {
    if (d !== undefined) setDays(d);
    invalidateReferralsCache();
    await loadData(d ?? days);
  }, [loadData, days]);

  const reload = useCallback(async () => {
    invalidateReferralsCache();
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
    kpis, settings, channels, topReferrers, recentConversions, watchlist,
    trends, impact, popularCodes, totalRevenue, loading, error, source, days, refresh,
    handleSaveSettings: async (s: ReferralSettings) => { await saveReferralSettings(s); await reload(); },
    handleCreateCampaign: async (name: string, audience: string, budget: number, startDate: string, endDate: string) => {
      const r = await createReferralCampaign(name, audience, budget, startDate, endDate);
      await reload();
      return r;
    },
    handleManualBonus: async (userId: string, points: number, reason: string) => {
      await sendManualBonus(userId, points, reason);
      await reload();
    },
    handleExport: exportReferralsData,
    handleAudit: async () => { const r = await realApi.auditReferrals(); await reload(); return r; },
  };
}
