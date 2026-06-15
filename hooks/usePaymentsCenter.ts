import { useState, useEffect, useCallback } from 'react';
import {
  fetchPaymentsBundle, invalidatePaymentsCache, retryPayment, exportPaymentsData, PAYMENTS_DEGRADED_MODE,
} from '../lib/admin/payments-api';
import {
  connectPaymentsWebSocket, disconnectPaymentsWebSocket, subscribePaymentsWs, isPaymentsWsConnected,
} from '../lib/admin/payments-websocket';
import type {
  PaymentKpis, PaymentTrendPoint, PaymentTrendPeriod, PaymentMethodBreakdown, PaymentZoneStats,
  PaymentTransaction, FailedTransaction, PaymentHealth, PaymentAlert, PaymentTruthCorridor,
  ReconciliationGap, FraudSignal, CommissionWidget, RefundWidget, PaymentInsight,
  PaymentTransactionDetail, PaymentWsEvent,
} from '../lib/admin/payments-types';

interface UsePaymentsCenterReturn {
  kpis: PaymentKpis | null;
  trend: Record<PaymentTrendPeriod, PaymentTrendPoint[]>;
  methods: PaymentMethodBreakdown[];
  zones: PaymentZoneStats[];
  transactions: PaymentTransaction[];
  failed: FailedTransaction[];
  health: PaymentHealth | null;
  alerts: PaymentAlert[];
  truthCorridors: PaymentTruthCorridor[];
  reconciliation: ReconciliationGap[];
  fraudSignals: FraudSignal[];
  commissionWidget: CommissionWidget | null;
  refundWidget: RefundWidget | null;
  insights: PaymentInsight[];
  transactionDetail: PaymentTransactionDetail | null;
  loading: boolean;
  error: string | null;
  degraded: boolean;
  wsConnected: boolean;
  refresh: () => Promise<void>;
  handleRetry: (paymentId: string) => Promise<void>;
  handleExport: (format: 'csv' | 'excel' | 'pdf' | 'json', scope?: 'transactions' | 'commissions' | 'refunds' | 'reconciliation' | 'anomalies') => Promise<{ filename: string; count: number }>;
}

export default function usePaymentsCenter(): UsePaymentsCenterReturn {
  const [kpis, setKpis] = useState<PaymentKpis | null>(null);
  const [trend, setTrend] = useState<Record<PaymentTrendPeriod, PaymentTrendPoint[]>>({ '24h': [], '7d': [], '30d': [], '90d': [], '1y': [] });
  const [methods, setMethods] = useState<PaymentMethodBreakdown[]>([]);
  const [zones, setZones] = useState<PaymentZoneStats[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [failed, setFailed] = useState<FailedTransaction[]>([]);
  const [health, setHealth] = useState<PaymentHealth | null>(null);
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);
  const [truthCorridors, setTruthCorridors] = useState<PaymentTruthCorridor[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationGap[]>([]);
  const [fraudSignals, setFraudSignals] = useState<FraudSignal[]>([]);
  const [commissionWidget, setCommissionWidget] = useState<CommissionWidget | null>(null);
  const [refundWidget, setRefundWidget] = useState<RefundWidget | null>(null);
  const [insights, setInsights] = useState<PaymentInsight[]>([]);
  const [transactionDetail, setTransactionDetail] = useState<PaymentTransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchPaymentsBundle>>) => {
    setKpis(bundle.kpis);
    setTrend(bundle.trend);
    setMethods(bundle.methods);
    setZones(bundle.zones);
    setTransactions(bundle.transactions);
    setFailed(bundle.failed);
    setHealth(bundle.health);
    setAlerts(bundle.alerts);
    setTruthCorridors(bundle.truthCorridors);
    setReconciliation(bundle.reconciliation);
    setFraudSignals(bundle.fraudSignals);
    setCommissionWidget(bundle.commissionWidget);
    setRefundWidget(bundle.refundWidget);
    setInsights(bundle.insights);
    setTransactionDetail(bundle.transactionDetail);
    setDegraded(bundle.degraded || PAYMENTS_DEGRADED_MODE);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      invalidatePaymentsCache();
      applyBundle(await fetchPaymentsBundle());
    } catch {
      setError('Impossible de charger le Payment Operations Center.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const onRefresh = () => loadData();
    window.addEventListener('admin-payments-refresh', onRefresh);
    return () => window.removeEventListener('admin-payments-refresh', onRefresh);
  }, [loadData]);

  useEffect(() => {
    connectPaymentsWebSocket();
    setWsConnected(isPaymentsWsConnected());
    const unsub = subscribePaymentsWs((event: PaymentWsEvent) => {
      if (['payment_failed', 'payment_fraud_detected', 'reconciliation_gap', 'payment_received'].includes(event.channel)) {
        loadData();
      }
    });
    const check = setInterval(() => setWsConnected(isPaymentsWsConnected()), 5000);
    return () => { unsub(); clearInterval(check); disconnectPaymentsWebSocket(); };
  }, [loadData]);

  return {
    kpis, trend, methods, zones, transactions, failed, health, alerts, truthCorridors,
    reconciliation, fraudSignals, commissionWidget, refundWidget, insights, transactionDetail,
    loading, error, degraded, wsConnected,
    refresh: loadData,
    handleRetry: async (id) => { await retryPayment(id); await loadData(); },
    handleExport: exportPaymentsData,
  };
}
