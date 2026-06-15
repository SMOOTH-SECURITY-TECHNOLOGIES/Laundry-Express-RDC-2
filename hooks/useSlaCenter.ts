import { useState, useEffect, useCallback } from 'react';
import {
  fetchSlaBundle,
  invalidateSlaCache,
  createSlaRule,
  exportSlaData,
  SLA_DEGRADED_MODE,
} from '../lib/admin/sla-api';
import type {
  SlaKpis,
  SlaDistribution,
  SlaHeatmap,
  SlaTimelinePoint,
  SlaTimelinePeriod,
  SlaZonePerformance,
  SlaPartnerPerformance,
  SlaDriverPerformance,
  SlaAtRiskOrder,
  SlaBreachedOrder,
  SlaViolationCause,
  SlaFinancialImpact,
  SlaTruthAnomaly,
  SlaProblematicOrder,
  SlaDispatcherSnapshot,
  SlaAlert,
  SlaRule,
  CreateSlaRulePayload,
} from '../lib/admin/sla-types';

interface UseSlaCenterReturn {
  kpis: SlaKpis | null;
  distribution: SlaDistribution | null;
  heatmap: SlaHeatmap | null;
  timeline: Record<SlaTimelinePeriod, SlaTimelinePoint[]>;
  zonePerformance: SlaZonePerformance[];
  partnerPerformance: SlaPartnerPerformance[];
  driverPerformance: SlaDriverPerformance[];
  atRiskOrders: SlaAtRiskOrder[];
  breachedOrders: SlaBreachedOrder[];
  violationCauses: SlaViolationCause[];
  financialImpact: SlaFinancialImpact | null;
  truthAnomalies: SlaTruthAnomaly[];
  problematicOrders: SlaProblematicOrder[];
  dispatcherSnapshot: SlaDispatcherSnapshot | null;
  alerts: SlaAlert[];
  rules: SlaRule[];
  loading: boolean;
  error: string | null;
  degraded: boolean;
  refresh: () => Promise<void>;
  handleCreateRule: (payload: CreateSlaRulePayload) => Promise<void>;
  handleExport: (format: 'csv' | 'excel' | 'pdf' | 'json') => Promise<{ filename: string; count: number }>;
}

export default function useSlaCenter(): UseSlaCenterReturn {
  const [kpis, setKpis] = useState<SlaKpis | null>(null);
  const [distribution, setDistribution] = useState<SlaDistribution | null>(null);
  const [heatmap, setHeatmap] = useState<SlaHeatmap | null>(null);
  const [timeline, setTimeline] = useState<Record<SlaTimelinePeriod, SlaTimelinePoint[]>>({ '24h': [], '7d': [], '30d': [], '90d': [] });
  const [zonePerformance, setZonePerformance] = useState<SlaZonePerformance[]>([]);
  const [partnerPerformance, setPartnerPerformance] = useState<SlaPartnerPerformance[]>([]);
  const [driverPerformance, setDriverPerformance] = useState<SlaDriverPerformance[]>([]);
  const [atRiskOrders, setAtRiskOrders] = useState<SlaAtRiskOrder[]>([]);
  const [breachedOrders, setBreachedOrders] = useState<SlaBreachedOrder[]>([]);
  const [violationCauses, setViolationCauses] = useState<SlaViolationCause[]>([]);
  const [financialImpact, setFinancialImpact] = useState<SlaFinancialImpact | null>(null);
  const [truthAnomalies, setTruthAnomalies] = useState<SlaTruthAnomaly[]>([]);
  const [problematicOrders, setProblematicOrders] = useState<SlaProblematicOrder[]>([]);
  const [dispatcherSnapshot, setDispatcherSnapshot] = useState<SlaDispatcherSnapshot | null>(null);
  const [alerts, setAlerts] = useState<SlaAlert[]>([]);
  const [rules, setRules] = useState<SlaRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchSlaBundle>>) => {
    setKpis(bundle.kpis);
    setDistribution(bundle.distribution);
    setHeatmap(bundle.heatmap);
    setTimeline(bundle.timeline);
    setZonePerformance(bundle.zonePerformance);
    setPartnerPerformance(bundle.partnerPerformance);
    setDriverPerformance(bundle.driverPerformance);
    setAtRiskOrders(bundle.atRiskOrders);
    setBreachedOrders(bundle.breachedOrders);
    setViolationCauses(bundle.violationCauses);
    setFinancialImpact(bundle.financialImpact);
    setTruthAnomalies(bundle.truthAnomalies);
    setProblematicOrders(bundle.problematicOrders);
    setDispatcherSnapshot(bundle.dispatcherSnapshot);
    setAlerts(bundle.alerts);
    setRules(bundle.rules);
    setDegraded(bundle.degraded || SLA_DEGRADED_MODE);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      invalidateSlaCache();
      applyBundle(await fetchSlaBundle());
    } catch {
      setError('Impossible de charger le SLA Center.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const onRefresh = () => loadData();
    window.addEventListener('admin-sla-refresh', onRefresh);
    return () => window.removeEventListener('admin-sla-refresh', onRefresh);
  }, [loadData]);

  return {
    kpis, distribution, heatmap, timeline, zonePerformance, partnerPerformance, driverPerformance,
    atRiskOrders, breachedOrders, violationCauses, financialImpact, truthAnomalies, problematicOrders,
    dispatcherSnapshot, alerts, rules, loading, error, degraded,
    refresh: loadData,
    handleCreateRule: async (p) => { await createSlaRule(p); await loadData(); },
    handleExport: exportSlaData,
  };
}
