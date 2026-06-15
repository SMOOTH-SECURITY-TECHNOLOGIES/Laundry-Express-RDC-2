import { useState, useEffect, useCallback } from 'react';
import type {
  AnomalyItem,
  AnomalySummary,
  SystemHealthItem,
  ImpactedCorridor,
  RevenueLeakageItem,
  AnomalyActivityEvent,
  AnomalyFilterState,
  ResolveAnomalyPayload,
  CreateInvestigationPayload,
} from '../lib/admin/anomalies-types';
import * as api from '../lib/admin/anomalies-api';

export function useAnomalyCenter() {
  const [summary, setSummary] = useState<AnomalySummary | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthItem[]>([]);
  const [corridors, setCorridors] = useState<ImpactedCorridor[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [totalAnomalies, setTotalAnomalies] = useState(0);
  const [revenueLeakage, setRevenueLeakage] = useState<RevenueLeakageItem[]>([]);
  const [activityFeed, setActivityFeed] = useState<AnomalyActivityEvent[]>([]);
  const [filters, setFilters] = useState<AnomalyFilterState>({
    severity: 'all',
    corridor: 'all',
    date: '',
    partner: 'all',
    driver: 'all',
    zone: 'all',
    status: 'all',
    search: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCorridor, setSelectedCorridor] = useState('all');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, h, c, r, a] = await Promise.all([
        api.fetchAnomalySummary(),
        api.fetchSystemHealth(),
        api.fetchImpactedCorridors(),
        api.fetchRevenueLeakage(),
        api.fetchActivityFeed(),
      ]);
      setSummary(s);
      setSystemHealth(h);
      setCorridors(c);
      setRevenueLeakage(r);
      setActivityFeed(a);
    } catch {
      setError('Impossible de charger les anomalies');
    }
    setLoading(false);
  }, []);

  const loadAnomalies = useCallback(async () => {
    const filterParams: Record<string, string> = {};
    if (filters.severity !== 'all') filterParams.severity = filters.severity;
    if (filters.corridor !== 'all') filterParams.corridor = filters.corridor;
    if (filters.status !== 'all') filterParams.status = filters.status;
    if (filters.search) filterParams.search = filters.search;
    if (selectedCorridor !== 'all') filterParams.corridor = selectedCorridor;

    const result = await api.fetchAnomalies(filterParams);
    setAnomalies(result.items);
    setTotalAnomalies(result.total);
  }, [filters, selectedCorridor]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadAnomalies();
  }, [loadAnomalies]);

  const investigate = useCallback(async (id: string) => {
    await api.investigateAnomaly(id);
  }, []);

  const createTicket = useCallback(async (id: string) => {
    await api.createTicket(id);
  }, []);

  const resolve = useCallback(async (id: string, payload: ResolveAnomalyPayload) => {
    await api.resolveAnomaly(id, payload);
    await loadAnomalies();
  }, [loadAnomalies]);

  const createInvestigation = useCallback(async (payload: CreateInvestigationPayload) => {
    await api.createInvestigation(payload);
  }, []);

  const runAudit = useCallback(async (type: string) => {
    await api.runAudit(type);
  }, []);

  const exportReport = useCallback(async () => {
    await api.exportReport();
  }, []);

  return {
    summary,
    systemHealth,
    corridors,
    anomalies,
    totalAnomalies,
    revenueLeakage,
    activityFeed,
    filters,
    loading,
    error,
    selectedCorridor,
    setFilters,
    setSelectedCorridor,
    investigate,
    createTicket,
    resolve,
    createInvestigation,
    runAudit,
    exportReport,
    refresh: loadAll,
  };
}
