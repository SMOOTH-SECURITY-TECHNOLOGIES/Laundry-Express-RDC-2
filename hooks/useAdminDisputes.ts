import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  DisputeSummary,
  DisputeRequest,
  DisputeBreakdownItem,
  DisputeStatusAmount,
  RefundTrendPoint,
  PartnerRefundRanking,
  RootCauseItem,
  DisputeSlaSummary,
  DisputeFinancialImpact,
  DisputeAnomaly,
  PlatformProtectionSummary,
  DisputeActivityEvent,
  DisputeFilterState,
  CreateDisputePayload,
  ApproveRefundPayload,
  RejectRefundPayload,
  AuditDisputesPayload,
} from '../lib/admin/disputes-types';
import {
  getDisputeSummary,
  getDisputeRequests,
  getDisputeBreakdown,
  getDisputeStatusAmounts,
  getRefundTrend,
  getPartnerRefundRanking,
  getRootCauses,
  getDisputeSla,
  getDisputeFinancialImpact,
  getDisputeAnomalies,
  getPlatformProtection,
  getDisputeActivity,
  getDisputePartners,
  createDispute,
  approveDispute,
  rejectDispute,
  assignDispute,
  investigateDispute,
  exportDisputes,
  auditDisputes,
  DISPUTES_WRITE_ENABLED,
  DISPUTES_DEGRADED_MODE,
} from '../lib/admin/disputes-api';

export const defaultDisputeFilters: DisputeFilterState = {
  status: '',
  type: '',
  dateFrom: '2026-05-01',
  dateTo: '2026-06-07',
  partner: '',
  paymentMethod: '',
  amountRange: '',
  search: '',
  severity: '',
};

function parseFiltersFromUrl(): Partial<DisputeFilterState> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const parsed: Partial<DisputeFilterState> = {};
  (Object.keys(defaultDisputeFilters) as (keyof DisputeFilterState)[]).forEach((key) => {
    const val = params.get(key);
    if (val) parsed[key] = val;
  });
  return parsed;
}

function syncFiltersToUrl(filters: DisputeFilterState): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();
  (Object.keys(filters) as (keyof DisputeFilterState)[]).forEach((key) => {
    if (filters[key]) params.set(key, filters[key]);
  });
  const qs = params.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', url);
}

function trackDisputeEvent(event: string, detail?: Record<string, string>): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin-analytics', { detail: { event, ...detail } }));
  }
}

export function useAdminDisputes() {
  const [summary, setSummary] = useState<DisputeSummary | null>(null);
  const [requests, setRequests] = useState<DisputeRequest[]>([]);
  const [breakdown, setBreakdown] = useState<DisputeBreakdownItem[]>([]);
  const [statusAmounts, setStatusAmounts] = useState<DisputeStatusAmount[]>([]);
  const [trend, setTrend] = useState<RefundTrendPoint[]>([]);
  const [partners, setPartners] = useState<PartnerRefundRanking[]>([]);
  const [partnerOptions, setPartnerOptions] = useState<string[]>([]);
  const [rootCauses, setRootCauses] = useState<RootCauseItem[]>([]);
  const [sla, setSla] = useState<DisputeSlaSummary | null>(null);
  const [financial, setFinancial] = useState<DisputeFinancialImpact | null>(null);
  const [anomalies, setAnomalies] = useState<DisputeAnomaly[]>([]);
  const [protection, setProtection] = useState<PlatformProtectionSummary | null>(null);
  const [activity, setActivity] = useState<DisputeActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<DisputeFilterState>({
    ...defaultDisputeFilters,
    ...parseFiltersFromUrl(),
  });
  const [readOnly] = useState(!DISPUTES_WRITE_ENABLED);
  const [degraded] = useState(DISPUTES_DEGRADED_MODE);
  const initialViewTracked = useRef(false);

  const setFilters = useCallback((next: DisputeFilterState) => {
    setFiltersState(next);
    syncFiltersToUrl(next);
    trackDisputeEvent('dispute_filter_changed', { status: next.status, type: next.type });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryData,
        requestsData,
        breakdownData,
        statusAmountsData,
        trendData,
        partnersData,
        rootCausesData,
        slaData,
        financialData,
        anomaliesData,
        protectionData,
        activityData,
        partnerOpts,
      ] = await Promise.all([
        getDisputeSummary(),
        getDisputeRequests(filters),
        getDisputeBreakdown(),
        getDisputeStatusAmounts(),
        getRefundTrend(),
        getPartnerRefundRanking(),
        getRootCauses(),
        getDisputeSla(),
        getDisputeFinancialImpact(),
        getDisputeAnomalies(),
        getPlatformProtection(),
        getDisputeActivity(),
        getDisputePartners(),
      ]);

      setSummary(summaryData);
      setRequests(requestsData);
      setBreakdown(breakdownData);
      setStatusAmounts(statusAmountsData);
      setTrend(trendData);
      setPartners(partnersData);
      setRootCauses(rootCausesData);
      setSla(slaData);
      setFinancial(financialData);
      setAnomalies(anomaliesData);
      setProtection(protectionData);
      setActivity(activityData);
      setPartnerOptions(partnerOpts);

      if (!initialViewTracked.current) {
        initialViewTracked.current = true;
        trackDisputeEvent('admin_disputes_viewed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError('Impossible de charger les litiges.');
      console.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const resetFilters = useCallback(() => {
    setFilters({ ...defaultDisputeFilters });
  }, [setFilters]);

  const handleCreateDispute = useCallback(async (payload: CreateDisputePayload) => {
    const created = await createDispute(payload);
    trackDisputeEvent('dispute_created', { id: created.id });
    await refresh();
    return created;
  }, [refresh]);

  const handleApprove = useCallback(async (id: string, payload: ApproveRefundPayload) => {
    await approveDispute(id, payload);
    trackDisputeEvent('refund_approved', { id });
    await refresh();
  }, [refresh]);

  const handleReject = useCallback(async (id: string, payload: RejectRefundPayload) => {
    await rejectDispute(id, payload);
    trackDisputeEvent('refund_rejected', { id });
    await refresh();
  }, [refresh]);

  const handleAssign = useCallback(async (id: string, assignee: string) => {
    await assignDispute(id, assignee);
    trackDisputeEvent('dispute_assigned', { id, assignee });
    await refresh();
  }, [refresh]);

  const handleInvestigate = useCallback(async (id: string) => {
    await investigateDispute(id);
    trackDisputeEvent('dispute_investigation_opened', { id });
    await refresh();
  }, [refresh]);

  const handleExport = useCallback(async () => {
    const result = await exportDisputes();
    trackDisputeEvent('disputes_exported', { count: String(result.count) });
    return result;
  }, []);

  const handleAudit = useCallback(async (payload: AuditDisputesPayload) => {
    const result = await auditDisputes(payload);
    trackDisputeEvent('disputes_audit_started', { auditId: result.auditId });
    return result;
  }, []);

  const openDispute = useCallback((id: string) => {
    trackDisputeEvent('dispute_opened', { id });
  }, []);

  const openOrderTruth = useCallback((orderId: string) => {
    trackDisputeEvent('dispute_order_truth_opened', { orderId });
  }, []);

  return {
    summary,
    requests,
    breakdown,
    statusAmounts,
    trend,
    partners,
    partnerOptions,
    rootCauses,
    sla,
    financial,
    anomalies,
    protection,
    activity,
    loading,
    error,
    refresh,
    filters,
    setFilters,
    resetFilters,
    readOnly,
    degraded,
    createDispute: handleCreateDispute,
    approveDispute: handleApprove,
    rejectDispute: handleReject,
    assignDispute: handleAssign,
    investigateDispute: handleInvestigate,
    exportDisputes: handleExport,
    auditDisputes: handleAudit,
    openDispute,
    openOrderTruth,
  };
}
