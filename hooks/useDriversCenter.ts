import { useState, useEffect, useCallback } from 'react';
import {
  fetchDriversBundle,
  invalidateDriversCache,
  addDriver,
  suspendDriver,
  exportDriversData,
  DRIVERS_DEGRADED_MODE,
} from '../lib/admin/drivers-api';
import { connectDriversWebSocket, disconnectDriversWebSocket, subscribeDriversWs } from '../lib/admin/drivers-websocket';
import type {
  Driver,
  DriverKpis,
  DriverHealthOverview,
  DriverMapPoint,
  DriverRankingEntry,
  DriverSlaData,
  DriverIncident,
  DriverReward,
  DriverWatchItem,
  DriverZoneAvailability,
  DriverRevenueTrend,
  DriverActivity,
  AddDriverPayload,
  DriverWsEvent,
} from '../lib/admin/drivers-types';

interface UseDriversCenterReturn {
  kpis: DriverKpis | null;
  drivers: Driver[];
  health: DriverHealthOverview | null;
  mapPoints: DriverMapPoint[];
  ranking: DriverRankingEntry[];
  sla: DriverSlaData | null;
  incidents: DriverIncident[];
  rewards: DriverReward[];
  watchList: DriverWatchItem[];
  zoneAvailability: DriverZoneAvailability[];
  revenueTrend: DriverRevenueTrend[];
  activity: DriverActivity[];
  loading: boolean;
  error: string | null;
  degraded: boolean;
  wsConnected: boolean;
  lastWsEvent: DriverWsEvent | null;
  refresh: () => Promise<void>;
  handleAddDriver: (payload: AddDriverPayload) => Promise<void>;
  handleSuspend: (driverId: string) => Promise<void>;
  handleExport: (format: 'csv' | 'excel' | 'pdf') => Promise<{ filename: string; count: number }>;
}

export default function useDriversCenter(): UseDriversCenterReturn {
  const [kpis, setKpis] = useState<DriverKpis | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [health, setHealth] = useState<DriverHealthOverview | null>(null);
  const [mapPoints, setMapPoints] = useState<DriverMapPoint[]>([]);
  const [ranking, setRanking] = useState<DriverRankingEntry[]>([]);
  const [sla, setSla] = useState<DriverSlaData | null>(null);
  const [incidents, setIncidents] = useState<DriverIncident[]>([]);
  const [rewards, setRewards] = useState<DriverReward[]>([]);
  const [watchList, setWatchList] = useState<DriverWatchItem[]>([]);
  const [zoneAvailability, setZoneAvailability] = useState<DriverZoneAvailability[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<DriverRevenueTrend[]>([]);
  const [activity, setActivity] = useState<DriverActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastWsEvent, setLastWsEvent] = useState<DriverWsEvent | null>(null);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchDriversBundle>>) => {
    setKpis(bundle.kpis);
    setDrivers(bundle.drivers);
    setHealth(bundle.health);
    setMapPoints(bundle.mapPoints);
    setRanking(bundle.ranking);
    setSla(bundle.sla);
    setIncidents(bundle.incidents);
    setRewards(bundle.rewards);
    setWatchList(bundle.watchList);
    setZoneAvailability(bundle.zoneAvailability);
    setRevenueTrend(bundle.revenueTrend);
    setActivity(bundle.activity);
    setDegraded(bundle.degraded || DRIVERS_DEGRADED_MODE);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      invalidateDriversCache();
      const bundle = await fetchDriversBundle();
      applyBundle(bundle);
    } catch {
      setError('Impossible de charger les chauffeurs.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    connectDriversWebSocket();
    setWsConnected(true);
    const unsub = subscribeDriversWs((event) => {
      setLastWsEvent(event);
      invalidateDriversCache();
      fetchDriversBundle().then(applyBundle).catch(() => undefined);
    });
    const onRefresh = () => loadData();
    window.addEventListener('admin-drivers-refresh', onRefresh);
    return () => {
      unsub();
      disconnectDriversWebSocket();
      window.removeEventListener('admin-drivers-refresh', onRefresh);
    };
  }, [applyBundle, loadData]);

  const refresh = useCallback(async () => { await loadData(); }, [loadData]);

  const handleAddDriver = useCallback(async (payload: AddDriverPayload) => {
    await addDriver(payload);
    await refresh();
  }, [refresh]);

  const handleSuspend = useCallback(async (driverId: string) => {
    await suspendDriver(driverId);
    await refresh();
  }, [refresh]);

  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'pdf') => exportDriversData(format), []);

  return {
    kpis, drivers, health, mapPoints, ranking, sla, incidents, rewards, watchList,
    zoneAvailability, revenueTrend, activity, loading, error, degraded, wsConnected,
    lastWsEvent, refresh, handleAddDriver, handleSuspend, handleExport,
  };
}
