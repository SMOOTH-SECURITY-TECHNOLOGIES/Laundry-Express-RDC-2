import { useState, useEffect, useCallback } from 'react';
import {
  fetchServiceSummary,
  fetchServicePerformance,
  fetchServiceRevenue,
  fetchServiceMix,
  fetchServiceGeo,
  fetchServiceHealth,
  fetchServiceTruth,
  fetchServiceFunnel,
  fetchServiceWatchlist,
  fetchServiceRankings,
  fetchServiceCatalog,
  fetchServiceAlerts,
} from '../lib/admin/services-api';
import type {
  AdminServiceSummary,
  AdminServicePerformance,
  AdminServiceRevenuePoint,
  AdminServiceMixItem,
  AdminServiceGeoZone,
  AdminServiceHealthItem,
  AdminServiceTruthCorridor,
  AdminServiceFunnelStep,
  AdminServiceWatchItem,
  AdminServiceRankingItem,
  AdminServiceCatalogItem,
  AdminServiceAlert,
} from '../lib/admin/services-types';

interface UseAdminServicesReturn {
  summary: AdminServiceSummary | null;
  performance: AdminServicePerformance[];
  revenue: AdminServiceRevenuePoint[];
  mix: AdminServiceMixItem[];
  geo: AdminServiceGeoZone[];
  health: AdminServiceHealthItem[];
  truth: AdminServiceTruthCorridor[];
  funnel: AdminServiceFunnelStep[];
  watchlist: AdminServiceWatchItem[];
  rankings: Record<string, AdminServiceRankingItem[]>;
  catalog: AdminServiceCatalogItem[];
  alerts: AdminServiceAlert[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export default function useAdminServices(): UseAdminServicesReturn {
  const [summary, setSummary] = useState<AdminServiceSummary | null>(null);
  const [performance, setPerformance] = useState<AdminServicePerformance[]>([]);
  const [revenue, setRevenue] = useState<AdminServiceRevenuePoint[]>([]);
  const [mix, setMix] = useState<AdminServiceMixItem[]>([]);
  const [geo, setGeo] = useState<AdminServiceGeoZone[]>([]);
  const [health, setHealth] = useState<AdminServiceHealthItem[]>([]);
  const [truth, setTruth] = useState<AdminServiceTruthCorridor[]>([]);
  const [funnel, setFunnel] = useState<AdminServiceFunnelStep[]>([]);
  const [watchlist, setWatchlist] = useState<AdminServiceWatchItem[]>([]);
  const [rankings, setRankings] = useState<Record<string, AdminServiceRankingItem[]>>({});
  const [catalog, setCatalog] = useState<AdminServiceCatalogItem[]>([]);
  const [alerts, setAlerts] = useState<AdminServiceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryData,
        performanceData,
        revenueData,
        mixData,
        geoData,
        healthData,
        truthData,
        funnelData,
        watchlistData,
        rankingsData,
        catalogData,
        alertsData,
      ] = await Promise.all([
        fetchServiceSummary(),
        fetchServicePerformance(),
        fetchServiceRevenue(),
        fetchServiceMix(),
        fetchServiceGeo(),
        fetchServiceHealth(),
        fetchServiceTruth(),
        fetchServiceFunnel(),
        fetchServiceWatchlist(),
        fetchServiceRankings(),
        fetchServiceCatalog(),
        fetchServiceAlerts(),
      ]);

      setSummary(summaryData);
      setPerformance(performanceData);
      setRevenue(revenueData);
      setMix(mixData);
      setGeo(geoData);
      setHealth(healthData);
      setTruth(truthData);
      setFunnel(funnelData);
      setWatchlist(watchlistData);
      setRankings(rankingsData);
      setCatalog(catalogData);
      setAlerts(alertsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    summary,
    performance,
    revenue,
    mix,
    geo,
    health,
    truth,
    funnel,
    watchlist,
    rankings,
    catalog,
    alerts,
    loading,
    error,
    refresh,
  };
}