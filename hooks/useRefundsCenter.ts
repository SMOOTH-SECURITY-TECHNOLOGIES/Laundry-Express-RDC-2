import { useState, useEffect, useCallback } from 'react';
import {
  fetchRefundsBundle,
  invalidateRefundsCache,
  approveRefund,
  rejectRefund,
  createRefundPolicy,
  exportRefundsData,
  REFUNDS_DEGRADED_MODE,
} from '../lib/admin/refunds-api';
import {
  connectRefundsWebSocket,
  disconnectRefundsWebSocket,
  subscribeRefundsWs,
  isRefundsWsConnected,
} from '../lib/admin/refunds-websocket';
import type {
  RefundKpis,
  RefundHealth,
  RefundPipelineSummary,
  RefundRequest,
  RefundTimelineStep,
  RefundReasonBreakdown,
  RefundPartnerStats,
  RefundMonthlyPoint,
  RefundLeakageItem,
  RefundTruthCorridor,
  RefundAlert,
  FraudDetectionItem,
  RefundAutomation,
  CreateRefundPolicyPayload,
  RefundWsEvent,
} from '../lib/admin/refunds-types';

interface UseRefundsCenterReturn {
  kpis: RefundKpis | null;
  health: RefundHealth | null;
  pipeline: RefundPipelineSummary | null;
  requests: RefundRequest[];
  timeline: RefundTimelineStep[];
  reasonBreakdown: RefundReasonBreakdown[];
  partnerStats: RefundPartnerStats[];
  monthlyTrend: RefundMonthlyPoint[];
  leakage: RefundLeakageItem[];
  truthCorridors: RefundTruthCorridor[];
  alerts: RefundAlert[];
  fraudItems: FraudDetectionItem[];
  automation: RefundAutomation | null;
  loading: boolean;
  error: string | null;
  degraded: boolean;
  wsConnected: boolean;
  refresh: () => Promise<void>;
  handleApprove: (refundId: string) => Promise<void>;
  handleReject: (refundId: string) => Promise<void>;
  handleCreatePolicy: (payload: CreateRefundPolicyPayload) => Promise<void>;
  handleExport: (format: 'csv' | 'excel' | 'pdf' | 'json', scope?: 'period' | 'partner' | 'reason' | 'status' | 'zone') => Promise<{ filename: string; count: number }>;
}

export default function useRefundsCenter(): UseRefundsCenterReturn {
  const [kpis, setKpis] = useState<RefundKpis | null>(null);
  const [health, setHealth] = useState<RefundHealth | null>(null);
  const [pipeline, setPipeline] = useState<RefundPipelineSummary | null>(null);
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [timeline, setTimeline] = useState<RefundTimelineStep[]>([]);
  const [reasonBreakdown, setReasonBreakdown] = useState<RefundReasonBreakdown[]>([]);
  const [partnerStats, setPartnerStats] = useState<RefundPartnerStats[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<RefundMonthlyPoint[]>([]);
  const [leakage, setLeakage] = useState<RefundLeakageItem[]>([]);
  const [truthCorridors, setTruthCorridors] = useState<RefundTruthCorridor[]>([]);
  const [alerts, setAlerts] = useState<RefundAlert[]>([]);
  const [fraudItems, setFraudItems] = useState<FraudDetectionItem[]>([]);
  const [automation, setAutomation] = useState<RefundAutomation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchRefundsBundle>>) => {
    setKpis(bundle.kpis);
    setHealth(bundle.health);
    setPipeline(bundle.pipeline);
    setRequests(bundle.requests);
    setTimeline(bundle.timeline);
    setReasonBreakdown(bundle.reasonBreakdown);
    setPartnerStats(bundle.partnerStats);
    setMonthlyTrend(bundle.monthlyTrend);
    setLeakage(bundle.leakage);
    setTruthCorridors(bundle.truthCorridors);
    setAlerts(bundle.alerts);
    setFraudItems(bundle.fraudItems);
    setAutomation(bundle.automation);
    setDegraded(bundle.degraded || REFUNDS_DEGRADED_MODE);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      invalidateRefundsCache();
      applyBundle(await fetchRefundsBundle());
    } catch {
      setError('Impossible de charger le Refund Center.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const onRefresh = () => loadData();
    window.addEventListener('admin-refunds-refresh', onRefresh);
    return () => window.removeEventListener('admin-refunds-refresh', onRefresh);
  }, [loadData]);

  useEffect(() => {
    connectRefundsWebSocket();
    setWsConnected(isRefundsWsConnected());
    const unsub = subscribeRefundsWs((event: RefundWsEvent) => {
      if (['refund_fraud_detected', 'refund_leakage_detected', 'refund_created'].includes(event.channel)) {
        loadData();
      }
    });
    const check = setInterval(() => setWsConnected(isRefundsWsConnected()), 5000);
    return () => { unsub(); clearInterval(check); disconnectRefundsWebSocket(); };
  }, [loadData]);

  return {
    kpis, health, pipeline, requests, timeline, reasonBreakdown, partnerStats,
    monthlyTrend, leakage, truthCorridors, alerts, fraudItems, automation,
    loading, error, degraded, wsConnected,
    refresh: loadData,
    handleApprove: async (id) => { await approveRefund(id); await loadData(); },
    handleReject: async (id) => { await rejectRefund(id); await loadData(); },
    handleCreatePolicy: async (p) => { await createRefundPolicy(p); await loadData(); },
    handleExport: exportRefundsData,
  };
}
