import { useState, useEffect, useCallback } from 'react';
import {
  fetchFinanceBundle,
  invalidateFinanceCache,
  createRevenueRule,
  exportFinanceData,
  FINANCE_DEGRADED_MODE,
} from '../lib/admin/finance-api';
import {
  connectFinanceWebSocket,
  disconnectFinanceWebSocket,
  subscribeFinanceWs,
  isFinanceWsConnected,
} from '../lib/admin/finance-websocket';
import type {
  FinanceDashboard,
  DailyRevenueSummary,
  RevenueBreakdownItem,
  PartnerRevenueRow,
  LeakageItem,
  FinancialAlert,
  ZoneRevenue,
  FinancialTruthCorridor,
  FinanceFilters,
  CreateRevenueRulePayload,
  FinanceWsEvent,
} from '../lib/admin/finance-types';

interface UseFinanceCenterReturn {
  dashboard: FinanceDashboard | null;
  dailyRevenue: DailyRevenueSummary | null;
  breakdown: RevenueBreakdownItem[];
  partners: PartnerRevenueRow[];
  leakage: LeakageItem[];
  alerts: FinancialAlert[];
  zones: ZoneRevenue[];
  truthCorridors: FinancialTruthCorridor[];
  loading: boolean;
  error: string | null;
  degraded: boolean;
  wsConnected: boolean;
  refresh: () => Promise<void>;
  handleCreateRule: (payload: CreateRevenueRulePayload) => Promise<void>;
  handleExport: (format: 'csv' | 'excel' | 'pdf' | 'json', scope?: 'finance' | 'marketplace' | 'logistics' | 'truth' | 'support') => Promise<{ filename: string; count: number }>;
  applyFilters: (filters: Partial<FinanceFilters>) => Promise<void>;
}

export default function useFinanceCenter(): UseFinanceCenterReturn {
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenueSummary | null>(null);
  const [breakdown, setBreakdown] = useState<RevenueBreakdownItem[]>([]);
  const [partners, setPartners] = useState<PartnerRevenueRow[]>([]);
  const [leakage, setLeakage] = useState<LeakageItem[]>([]);
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [zones, setZones] = useState<ZoneRevenue[]>([]);
  const [truthCorridors, setTruthCorridors] = useState<FinancialTruthCorridor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchFinanceBundle>>) => {
    setDashboard(bundle.dashboard);
    setDailyRevenue(bundle.dailyRevenue);
    setBreakdown(bundle.breakdown);
    setPartners(bundle.partners);
    setLeakage(bundle.leakage);
    setAlerts(bundle.alerts);
    setZones(bundle.zones);
    setTruthCorridors(bundle.truthCorridors);
    setDegraded(bundle.degraded || FINANCE_DEGRADED_MODE);
  }, []);

  const loadData = useCallback(async (filters?: Partial<FinanceFilters>) => {
    setLoading(true);
    setError(null);
    try {
      if (!filters) invalidateFinanceCache();
      applyBundle(await fetchFinanceBundle(filters));
    } catch {
      setError('Impossible de charger le Finance Center.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const onRefresh = () => loadData();
    window.addEventListener('admin-finance-refresh', onRefresh);
    return () => window.removeEventListener('admin-finance-refresh', onRefresh);
  }, [loadData]);

  useEffect(() => {
    connectFinanceWebSocket();
    setWsConnected(isFinanceWsConnected());
    const unsub = subscribeFinanceWs((event: FinanceWsEvent) => {
      if (event.channel === 'financial_alert' || event.channel === 'revenue_leak_detected') {
        loadData();
      }
    });
    const check = setInterval(() => setWsConnected(isFinanceWsConnected()), 5000);
    return () => { unsub(); clearInterval(check); disconnectFinanceWebSocket(); };
  }, [loadData]);

  return {
    dashboard, dailyRevenue, breakdown, partners, leakage, alerts, zones, truthCorridors,
    loading, error, degraded, wsConnected,
    refresh: () => loadData(),
    handleCreateRule: async (p) => { await createRevenueRule(p); await loadData(); },
    handleExport: exportFinanceData,
    applyFilters: (f) => loadData(f),
  };
}
