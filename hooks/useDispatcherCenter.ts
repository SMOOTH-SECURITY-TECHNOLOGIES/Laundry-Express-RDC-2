import { useState, useEffect, useCallback } from 'react';
import {
  fetchDispatcherBundle,
  invalidateDispatcherCache,
  assignMission,
  autoDispatchMissions,
  exportDispatcherData,
  DISPATCHER_DEGRADED_MODE,
} from '../lib/admin/dispatcher-api';
import {
  connectDispatcherWebSocket,
  disconnectDispatcherWebSocket,
  subscribeDispatcherWs,
} from '../lib/admin/dispatcher-websocket';
import type {
  DispatcherKpis,
  BacklogMission,
  ActiveMission,
  AvailableDriver,
  DriverHealth,
  DispatcherSlaData,
  MapPoint,
  MapCluster,
  MapZoneKpi,
  DispatcherIncident,
  RevenueImpact,
  TopDriver,
  DispatcherAnalytics,
  AutoDispatchResult,
  DispatcherWsEvent,
} from '../lib/admin/dispatcher-types';

interface UseDispatcherCenterReturn {
  kpis: DispatcherKpis | null;
  backlog: BacklogMission[];
  activeMissions: ActiveMission[];
  drivers: AvailableDriver[];
  driverHealth: DriverHealth | null;
  sla: DispatcherSlaData | null;
  mapPoints: MapPoint[];
  mapClusters: MapCluster[];
  mapZoneKpis: MapZoneKpi[];
  incidents: DispatcherIncident[];
  revenue: RevenueImpact | null;
  topDrivers: TopDriver[];
  analytics: DispatcherAnalytics | null;
  loading: boolean;
  error: string | null;
  degraded: boolean;
  wsConnected: boolean;
  lastWsEvent: DispatcherWsEvent | null;
  refresh: () => Promise<void>;
  handleAssign: (missionId: string, driverId: string) => Promise<void>;
  handleAutoDispatch: () => Promise<AutoDispatchResult>;
  handleExport: (format: 'csv' | 'excel' | 'pdf') => Promise<{ filename: string; count: number }>;
}

export default function useDispatcherCenter(): UseDispatcherCenterReturn {
  const [kpis, setKpis] = useState<DispatcherKpis | null>(null);
  const [backlog, setBacklog] = useState<BacklogMission[]>([]);
  const [activeMissions, setActiveMissions] = useState<ActiveMission[]>([]);
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [driverHealth, setDriverHealth] = useState<DriverHealth | null>(null);
  const [sla, setSla] = useState<DispatcherSlaData | null>(null);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [mapClusters, setMapClusters] = useState<MapCluster[]>([]);
  const [mapZoneKpis, setMapZoneKpis] = useState<MapZoneKpi[]>([]);
  const [incidents, setIncidents] = useState<DispatcherIncident[]>([]);
  const [revenue, setRevenue] = useState<RevenueImpact | null>(null);
  const [topDrivers, setTopDrivers] = useState<TopDriver[]>([]);
  const [analytics, setAnalytics] = useState<DispatcherAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastWsEvent, setLastWsEvent] = useState<DispatcherWsEvent | null>(null);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchDispatcherBundle>>) => {
    setKpis(bundle.kpis);
    setBacklog(bundle.backlog);
    setActiveMissions(bundle.activeMissions);
    setDrivers(bundle.drivers);
    setDriverHealth(bundle.driverHealth);
    setSla(bundle.sla);
    setMapPoints(bundle.mapPoints);
    setMapClusters(bundle.mapClusters);
    setMapZoneKpis(bundle.mapZoneKpis);
    setIncidents(bundle.incidents);
    setRevenue(bundle.revenue);
    setTopDrivers(bundle.topDrivers);
    setAnalytics(bundle.analytics);
    setDegraded(bundle.degraded || DISPATCHER_DEGRADED_MODE);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      invalidateDispatcherCache();
      const bundle = await fetchDispatcherBundle();
      applyBundle(bundle);
    } catch {
      setError('Impossible de charger le cockpit dispatcher.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    connectDispatcherWebSocket();
    setWsConnected(true);

    const unsubscribe = subscribeDispatcherWs((event) => {
      setLastWsEvent(event);
      if (
        event.channel.startsWith('mission.') ||
        event.channel === 'driver.online' ||
        event.channel === 'driver.offline' ||
        event.channel === 'sla.breach' ||
        event.channel === 'incident.created'
      ) {
        invalidateDispatcherCache();
        fetchDispatcherBundle().then(applyBundle).catch(() => undefined);
      }
    });

    const onRefresh = () => loadData();
    window.addEventListener('admin-dispatcher-refresh', onRefresh);

    return () => {
      unsubscribe();
      disconnectDispatcherWebSocket();
      window.removeEventListener('admin-dispatcher-refresh', onRefresh);
    };
  }, [applyBundle, loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const handleAssign = useCallback(async (missionId: string, driverId: string) => {
    await assignMission({ missionId, driverId });
    await refresh();
  }, [refresh]);

  const handleAutoDispatch = useCallback(async () => {
    const result = await autoDispatchMissions();
    await refresh();
    return result;
  }, [refresh]);

  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    return exportDispatcherData(format);
  }, []);

  return {
    kpis,
    backlog,
    activeMissions,
    drivers,
    driverHealth,
    sla,
    mapPoints,
    mapClusters,
    mapZoneKpis,
    incidents,
    revenue,
    topDrivers,
    analytics,
    loading,
    error,
    degraded,
    wsConnected,
    lastWsEvent,
    refresh,
    handleAssign,
    handleAutoDispatch,
    handleExport,
  };
}
