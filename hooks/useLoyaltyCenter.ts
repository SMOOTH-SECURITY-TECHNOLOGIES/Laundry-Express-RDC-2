import { useState, useEffect, useCallback } from 'react';
import {
  fetchLoyaltyBundle, invalidateLoyaltyCache, saveLoyaltySettings,
  runLoyaltyExpiration, createReward, disableReward, exportLoyaltyData,
} from '../lib/admin/loyalty-api';
import type {
  LoyaltyKpis, LoyaltyHealth, LoyaltySettingsCard, LoyaltyReward, EarningRule,
  LoyaltyActivity, TopLoyaltyUser, TopRedeemer, RetentionPoint, RevenueImpact,
  CohortRow, LoyaltyRisk, LoyaltySegment, LoyaltyIntegration,
} from '../lib/admin/loyalty-types';

export default function useLoyaltyCenter(initialDays = 7) {
  const [kpis, setKpis] = useState<LoyaltyKpis | null>(null);
  const [health, setHealth] = useState<LoyaltyHealth | null>(null);
  const [settings, setSettings] = useState<LoyaltySettingsCard | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [earningRules, setEarningRules] = useState<EarningRule[]>([]);
  const [activity, setActivity] = useState<LoyaltyActivity[]>([]);
  const [topUsers, setTopUsers] = useState<TopLoyaltyUser[]>([]);
  const [topRedeemers, setTopRedeemers] = useState<TopRedeemer[]>([]);
  const [retention, setRetention] = useState<RetentionPoint[]>([]);
  const [revenueImpact, setRevenueImpact] = useState<RevenueImpact | null>(null);
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [risks, setRisks] = useState<LoyaltyRisk[]>([]);
  const [segments, setSegments] = useState<LoyaltySegment[]>([]);
  const [integrations, setIntegrations] = useState<LoyaltyIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('backend');
  const [days, setDays] = useState(initialDays);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchLoyaltyBundle>>) => {
    setKpis(bundle.kpis);
    setHealth(bundle.health);
    setSettings(bundle.settings);
    setRewards(bundle.rewards);
    setEarningRules(bundle.earningRules);
    setActivity(bundle.activity);
    setTopUsers(bundle.topUsers);
    setTopRedeemers(bundle.topRedeemers);
    setRetention(bundle.retention);
    setRevenueImpact(bundle.revenueImpact);
    setCohorts(bundle.cohorts);
    setRisks(bundle.risks);
    setSegments(bundle.segments);
    setIntegrations(bundle.integrations);
    setSource(bundle.source);
  }, []);

  const loadData = useCallback(async (d = days) => {
    setLoading(true);
    setError(null);
    try {
      applyBundle(await fetchLoyaltyBundle(d));
    } catch {
      setError('Impossible de charger le Loyalty & Retention Center.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle, days]);

  const refresh = useCallback(async (d?: number) => {
    if (d !== undefined) setDays(d);
    invalidateLoyaltyCache();
    await loadData(d ?? days);
  }, [loadData, days]);

  const reload = useCallback(async () => {
    invalidateLoyaltyCache();
    await loadData();
  }, [loadData]);

  useEffect(() => { loadData(initialDays); }, [loadData, initialDays]);

  return {
    kpis, health, settings, rewards, earningRules, activity,
    topUsers, topRedeemers, retention, revenueImpact, cohorts,
    risks, segments, integrations, loading, error, source, refresh,
    handleSaveSettings: async (s: LoyaltySettingsCard) => { await saveLoyaltySettings(s); await reload(); },
    handleRunExpiration: async () => { const r = await runLoyaltyExpiration(); await reload(); return r; },
    handleCreateReward: async (name: string, pts: number, val: number) => { const r = await createReward(name, pts, val); await reload(); return r; },
    handleDisableReward: async (id: string) => { await disableReward(id); await reload(); },
    handleExport: exportLoyaltyData,
  };
}
