import { useEffect, useRef, useCallback, useState } from 'react';

/* ─── Types ─── */
interface UsePollingOptions<T> {
  /** Fonction de fetch des données */
  fetcher: () => Promise<T>;
  /** Intervalle en ms (défaut: 30000) */
  interval?: number;
  /** Activer le polling (défaut: true) */
  enabled?: boolean;
  /** Callback en cas d'erreur */
  onError?: (error: Error) => void;
  /** Callback après chaque fetch réussi */
  onData?: (data: T) => void;
  /** Callback avant le premier fetch */
  onMount?: () => void;
}

interface UsePollingResult<T> {
  /** Données actuelles */
  data: T | null;
  /** État de chargement */
  isLoading: boolean;
  /** Dernière erreur */
  error: Error | null;
  /** Dernière mise à jour */
  lastUpdated: Date | null;
  /** Mode backend ou dégradé */
  mode: 'backend' | 'degraded';
  /** Forcer un refresh immédiat */
  refresh: () => Promise<void>;
  /** Pause le polling */
  pause: () => void;
  /** Reprendre le polling */
  resume: () => void;
}

/* ─── Hook ─── */
export function usePolling<T>({
  fetcher,
  interval = 30000,
  enabled = true,
  onError,
  onData,
  onMount,
}: UsePollingOptions<T>): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mode, setMode] = useState<'backend' | 'degraded'>('degraded');
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const onDataRef = useRef(onData);
  const onErrorRef = useRef(onError);
  const onMountRef = useRef(onMount);

  useEffect(() => {
    onDataRef.current = onData;
    onErrorRef.current = onError;
    onMountRef.current = onMount;
  }, [onData, onError, onMount]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fetcher();
      if (!mountedRef.current) return;

      setData(result);
      setLastUpdated(new Date());
      setError(null);
      setMode('backend');
      onDataRef.current?.(result);
    } catch (err) {
      if (!mountedRef.current) return;
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setMode('degraded');
      onErrorRef.current?.(error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetcher]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  useEffect(() => {
    mountedRef.current = true;
    onMountRef.current?.();
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  useEffect(() => {
    if (!enabled || isPaused) {
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
  }, [enabled, isPaused, interval, fetchData]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    mode,
    refresh,
    pause,
    resume,
  };
}

export default usePolling;
