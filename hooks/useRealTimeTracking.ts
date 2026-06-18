import { useEffect, useRef, useState, useCallback } from 'react';
import { realApi } from '../services/real-api';
import type { LogisticsTask, LogisticsDriver } from '../services/real-api';
import {
  connectLogisticsWebSocket,
  disconnectLogisticsWebSocket,
  subscribeLogisticsWs,
} from '../lib/logistics-websocket';

/* ─── Types ─── */
interface TrackingData {
  tasks: LogisticsTask[];
  drivers: LogisticsDriver[];
  lastSync: Date;
}

interface UseRealTimeTrackingOptions {
  /** Intervalle de polling en ms (défaut: 15000) */
  interval?: number;
  /** Activer le tracking (défaut: true) */
  enabled?: boolean;
}

interface UseRealTimeTrackingResult {
  /** Données de tracking */
  data: TrackingData;
  /** État de chargement */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: Error | null;
  /** Dernière sync */
  lastSync: Date | null;
  /** Mode backend ou dégradé */
  mode: 'backend' | 'degraded';
  /** Forcer un refresh */
  refresh: () => Promise<void>;
}

/* ─── Hook ─── */
export function useRealTimeTracking({
  interval = 15000,
  enabled = true,
}: UseRealTimeTrackingOptions = {}): UseRealTimeTrackingResult {
  const [data, setData] = useState<TrackingData>({
    tasks: [],
    drivers: [],
    lastSync: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [mode, setMode] = useState<'backend' | 'degraded'>('degraded');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tasksResponse, driversResponse] = await Promise.all([
        realApi.getLogisticsTasks({ page: 1, page_size: 100 }),
        realApi.getLogisticsDrivers({ page: 1, page_size: 100 }),
      ]);

      if (!mountedRef.current) return;

      setData({
        tasks: tasksResponse.tasks || [],
        drivers: driversResponse.drivers || [],
        lastSync: new Date(),
      });
      setLastSync(new Date());
      setError(null);
      setMode('backend');
    } catch (err) {
      if (!mountedRef.current) return;
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setMode('degraded');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!enabled) return;

    connectLogisticsWebSocket();
    const unsub = subscribeLogisticsWs(() => {
      void fetchData();
    });

    return () => {
      unsub();
      disconnectLogisticsWebSocket();
    };
  }, [enabled, fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, fetchData]);

  return {
    data,
    isLoading,
    error,
    lastSync,
    mode,
    refresh,
  };
}

export default useRealTimeTracking;
