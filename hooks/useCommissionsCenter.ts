import { useState, useEffect, useCallback } from 'react';
import {
  fetchCommissionsBundle,
  invalidateCommissionsCache,
  createCommissionRule,
  updateCommissionRule,
  exportCommissionsData,
  COMMISSIONS_DEGRADED_MODE,
} from '../lib/admin/commissions-api';
import {
  connectCommissionsWebSocket,
  disconnectCommissionsWebSocket,
  subscribeCommissionsWs,
  isCommissionsWsConnected,
} from '../lib/admin/commissions-websocket';
import type {
  CommissionKpis,
  CommissionHealth,
  CommissionRule,
  CommissionServiceRow,
  CommissionPartnerRow,
  CommissionTimelineStep,
  CommissionLeakageItem,
  CommissionTopPartner,
  CommissionMonthlyPoint,
  CommissionBreakdownItem,
  CommissionRevenueVsCommission,
  CommissionTruthCorridor,
  CommissionAlert,
  CommissionAutomation,
  CreateCommissionRulePayload,
  UpdateCommissionRulePayload,
  CommissionWsEvent,
} from '../lib/admin/commissions-types';

interface UseCommissionsCenterReturn {
  kpis: CommissionKpis | null;
  health: CommissionHealth | null;
  rules: CommissionRule[];
  services: CommissionServiceRow[];
  partners: CommissionPartnerRow[];
  timeline: CommissionTimelineStep[];
  leakage: CommissionLeakageItem[];
  topPartners: CommissionTopPartner[];
  monthlyTrend: CommissionMonthlyPoint[];
  breakdown: CommissionBreakdownItem[];
  revenueVsCommission: CommissionRevenueVsCommission[];
  truthCorridors: CommissionTruthCorridor[];
  alerts: CommissionAlert[];
  automation: CommissionAutomation | null;
  loading: boolean;
  error: string | null;
  degraded: boolean;
  wsConnected: boolean;
  refresh: () => Promise<void>;
  handleCreateRule: (payload: CreateCommissionRulePayload) => Promise<void>;
  handleUpdateRule: (payload: UpdateCommissionRulePayload) => Promise<void>;
  handleExport: (format: 'csv' | 'excel' | 'pdf' | 'json', scope?: 'partner' | 'period' | 'service' | 'zone' | 'status') => Promise<{ filename: string; count: number }>;
}

export default function useCommissionsCenter(): UseCommissionsCenterReturn {
  const [kpis, setKpis] = useState<CommissionKpis | null>(null);
  const [health, setHealth] = useState<CommissionHealth | null>(null);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [services, setServices] = useState<CommissionServiceRow[]>([]);
  const [partners, setPartners] = useState<CommissionPartnerRow[]>([]);
  const [timeline, setTimeline] = useState<CommissionTimelineStep[]>([]);
  const [leakage, setLeakage] = useState<CommissionLeakageItem[]>([]);
  const [topPartners, setTopPartners] = useState<CommissionTopPartner[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<CommissionMonthlyPoint[]>([]);
  const [breakdown, setBreakdown] = useState<CommissionBreakdownItem[]>([]);
  const [revenueVsCommission, setRevenueVsCommission] = useState<CommissionRevenueVsCommission[]>([]);
  const [truthCorridors, setTruthCorridors] = useState<CommissionTruthCorridor[]>([]);
  const [alerts, setAlerts] = useState<CommissionAlert[]>([]);
  const [automation, setAutomation] = useState<CommissionAutomation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchCommissionsBundle>>) => {
    setKpis(bundle.kpis);
    setHealth(bundle.health);
    setRules(bundle.rules);
    setServices(bundle.services);
    setPartners(bundle.partners);
    setTimeline(bundle.timeline);
    setLeakage(bundle.leakage);
    setTopPartners(bundle.topPartners);
    setMonthlyTrend(bundle.monthlyTrend);
    setBreakdown(bundle.breakdown);
    setRevenueVsCommission(bundle.revenueVsCommission);
    setTruthCorridors(bundle.truthCorridors);
    setAlerts(bundle.alerts);
    setAutomation(bundle.automation);
    setDegraded(bundle.degraded || COMMISSIONS_DEGRADED_MODE);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      invalidateCommissionsCache();
      applyBundle(await fetchCommissionsBundle());
    } catch {
      setError('Impossible de charger le Commission Center.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const onRefresh = () => loadData();
    window.addEventListener('admin-commissions-refresh', onRefresh);
    return () => window.removeEventListener('admin-commissions-refresh', onRefresh);
  }, [loadData]);

  useEffect(() => {
    connectCommissionsWebSocket();
    setWsConnected(isCommissionsWsConnected());
    const unsub = subscribeCommissionsWs((event: CommissionWsEvent) => {
      if (['commission_leak_detected', 'commission_blocked', 'commission_disputed'].includes(event.channel)) {
        loadData();
      }
    });
    const check = setInterval(() => setWsConnected(isCommissionsWsConnected()), 5000);
    return () => { unsub(); clearInterval(check); disconnectCommissionsWebSocket(); };
  }, [loadData]);

  return {
    kpis, health, rules, services, partners, timeline, leakage, topPartners,
    monthlyTrend, breakdown, revenueVsCommission, truthCorridors, alerts, automation,
    loading, error, degraded, wsConnected,
    refresh: loadData,
    handleCreateRule: async (p) => { await createCommissionRule(p); await loadData(); },
    handleUpdateRule: async (p) => { await updateCommissionRule(p); await loadData(); },
    handleExport: exportCommissionsData,
  };
}
