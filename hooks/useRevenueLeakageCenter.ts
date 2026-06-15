import { useState, useEffect, useCallback } from 'react';
import {
  fetchRevenueLeakageBundle, invalidateLeakageCache, investigateLeakageCase,
  resolveLeakageCase, assignLeakageCase, exportLeakageData, LEAKAGE_DEGRADED_MODE,
} from '../lib/admin/revenue-leakage-api';
import {
  connectLeakageWebSocket, disconnectLeakageWebSocket, subscribeLeakageWs, isLeakageWsConnected,
} from '../lib/admin/revenue-leakage-websocket';
import type {
  LeakageKpis, LeakageRiskScore, OrphanPayment, UnbilledCollection, MissingCommission,
  SuspiciousRefund, UncollectedOrder, PayoutAnomaly, LeakageTimelineEvent, LeakageCorridorStep,
  LeakagePartnerRank, LeakageZoneStats, LeakageTrendPoint, LeakageTrendPeriod, LeakageAlert,
  LeakageCaseAssignment, TruthCorridorHealth, LeakageFinancialImpact, LeakageInsight,
  LeakageInvestigationDetail, LeakageAssignee, LeakageCaseStatus,
} from '../lib/admin/revenue-leakage-types';

interface UseRevenueLeakageCenterReturn {
  kpis: LeakageKpis | null;
  riskScore: LeakageRiskScore | null;
  orphanPayments: OrphanPayment[];
  unbilledCollections: UnbilledCollection[];
  missingCommissions: MissingCommission[];
  suspiciousRefunds: SuspiciousRefund[];
  uncollectedOrders: UncollectedOrder[];
  payoutAnomalies: PayoutAnomaly[];
  timeline: LeakageTimelineEvent[];
  corridor: LeakageCorridorStep[];
  partners: LeakagePartnerRank[];
  zones: LeakageZoneStats[];
  trend: Record<LeakageTrendPeriod, LeakageTrendPoint[]>;
  alerts: LeakageAlert[];
  assignments: LeakageCaseAssignment[];
  truthHealth: TruthCorridorHealth[];
  financialImpact: LeakageFinancialImpact | null;
  insights: LeakageInsight[];
  investigationDetail: LeakageInvestigationDetail | null;
  loading: boolean;
  error: string | null;
  degraded: boolean;
  wsConnected: boolean;
  refresh: () => Promise<void>;
  handleInvestigate: (caseId: string) => Promise<void>;
  handleResolve: (caseId: string) => Promise<void>;
  handleAssign: (caseId: string, assignee: LeakageAssignee, status: LeakageCaseStatus) => Promise<void>;
  handleExport: (format: 'csv' | 'excel' | 'pdf' | 'json', scope?: 'cases' | 'orphans' | 'commissions' | 'reconciliation' | 'anomalies') => Promise<{ filename: string; count: number }>;
}

export default function useRevenueLeakageCenter(): UseRevenueLeakageCenterReturn {
  const [kpis, setKpis] = useState<LeakageKpis | null>(null);
  const [riskScore, setRiskScore] = useState<LeakageRiskScore | null>(null);
  const [orphanPayments, setOrphanPayments] = useState<OrphanPayment[]>([]);
  const [unbilledCollections, setUnbilledCollections] = useState<UnbilledCollection[]>([]);
  const [missingCommissions, setMissingCommissions] = useState<MissingCommission[]>([]);
  const [suspiciousRefunds, setSuspiciousRefunds] = useState<SuspiciousRefund[]>([]);
  const [uncollectedOrders, setUncollectedOrders] = useState<UncollectedOrder[]>([]);
  const [payoutAnomalies, setPayoutAnomalies] = useState<PayoutAnomaly[]>([]);
  const [timeline, setTimeline] = useState<LeakageTimelineEvent[]>([]);
  const [corridor, setCorridor] = useState<LeakageCorridorStep[]>([]);
  const [partners, setPartners] = useState<LeakagePartnerRank[]>([]);
  const [zones, setZones] = useState<LeakageZoneStats[]>([]);
  const [trend, setTrend] = useState<Record<LeakageTrendPeriod, LeakageTrendPoint[]>>({ day: [], week: [], month: [], quarter: [], year: [] });
  const [alerts, setAlerts] = useState<LeakageAlert[]>([]);
  const [assignments, setAssignments] = useState<LeakageCaseAssignment[]>([]);
  const [truthHealth, setTruthHealth] = useState<TruthCorridorHealth[]>([]);
  const [financialImpact, setFinancialImpact] = useState<LeakageFinancialImpact | null>(null);
  const [insights, setInsights] = useState<LeakageInsight[]>([]);
  const [investigationDetail, setInvestigationDetail] = useState<LeakageInvestigationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchRevenueLeakageBundle>>) => {
    setKpis(bundle.kpis);
    setRiskScore(bundle.riskScore);
    setOrphanPayments(bundle.orphanPayments);
    setUnbilledCollections(bundle.unbilledCollections);
    setMissingCommissions(bundle.missingCommissions);
    setSuspiciousRefunds(bundle.suspiciousRefunds);
    setUncollectedOrders(bundle.uncollectedOrders);
    setPayoutAnomalies(bundle.payoutAnomalies);
    setTimeline(bundle.timeline);
    setCorridor(bundle.corridor);
    setPartners(bundle.partners);
    setZones(bundle.zones);
    setTrend(bundle.trend);
    setAlerts(bundle.alerts);
    setAssignments(bundle.assignments);
    setTruthHealth(bundle.truthHealth);
    setFinancialImpact(bundle.financialImpact);
    setInsights(bundle.insights);
    setInvestigationDetail(bundle.investigationDetail);
    setDegraded(bundle.degraded || LEAKAGE_DEGRADED_MODE);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await fetchRevenueLeakageBundle();
      applyBundle(bundle);
    } catch {
      setError('Impossible de charger le Revenue Leakage Center.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle]);

  const refresh = useCallback(async () => {
    invalidateLeakageCache();
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
    connectLeakageWebSocket();
    const unsub = subscribeLeakageWs((ev) => {
      if (ev.type === 'leakage_detected') {
        setAlerts((prev) => [ev.alert, ...prev].slice(0, 20));
        setKpis((k) => k ? { ...k, openCases: k.openCases + 1 } : k);
      }
    });
    const wsPoll = setInterval(() => setWsConnected(isLeakageWsConnected()), 3000);
    return () => { unsub(); disconnectLeakageWebSocket(); clearInterval(wsPoll); };
  }, [loadData]);

  const handleInvestigate = useCallback(async (caseId: string) => { await investigateLeakageCase(caseId); }, []);
  const handleResolve = useCallback(async (caseId: string) => { await resolveLeakageCase(caseId); }, []);
  const handleAssign = useCallback(async (caseId: string, assignee: LeakageAssignee, status: LeakageCaseStatus) => {
    await assignLeakageCase(caseId, assignee, status);
  }, []);
  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'pdf' | 'json', scope?: 'cases' | 'orphans' | 'commissions' | 'reconciliation' | 'anomalies') => {
    return exportLeakageData(format, scope);
  }, []);

  return {
    kpis, riskScore, orphanPayments, unbilledCollections, missingCommissions, suspiciousRefunds,
    uncollectedOrders, payoutAnomalies, timeline, corridor, partners, zones, trend, alerts,
    assignments, truthHealth, financialImpact, insights, investigationDetail,
    loading, error, degraded, wsConnected, refresh, handleInvestigate, handleResolve, handleAssign, handleExport,
  };
}
