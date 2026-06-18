import { useEffect, useRef, useState, useCallback } from 'react';
import { realApi } from '../services/real-api';
import type { LogisticsTask, LogisticsDriver } from '../services/real-api';
import {
  connectLogisticsWebSocket,
  disconnectLogisticsWebSocket,
  subscribeLogisticsWs,
} from '../lib/logistics-websocket';

/* ─── Types ─── */
interface Alert {
  id: string;
  type: 'retard' | 'attente' | 'inactif' | 'paiement';
  title: string;
  description: string;
  count: number;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
}

interface UseRealTimeAlertsOptions {
  /** Intervalle de vérification en ms (défaut: 30000) */
  interval?: number;
  /** Activer les alertes (défaut: true) */
  enabled?: boolean;
  /** Seuil de retard en minutes (défaut: 15) */
  delayThreshold?: number;
}

interface UseRealTimeAlertsResult {
  /** Liste des alertes */
  alerts: Alert[];
  /** Nombre d'alertes critiques */
  criticalCount: number;
  /** État de chargement */
  isLoading: boolean;
  /** Dernière vérification */
  lastChecked: Date | null;
  /** Forcer une vérification */
  refresh: () => Promise<void>;
  /** Dismiss une alerte */
  dismiss: (id: string) => void;
}

/* ─── Helpers ─── */
const buildAlertsFromData = (
  tasks: LogisticsTask[],
  drivers: LogisticsDriver[],
  delayThreshold: number
): Alert[] => {
  const alerts: Alert[] = [];
  const now = Date.now();

  // Retards
  tasks
    .filter((task) => {
      if (!task.created_at) return false;
      const age = (now - new Date(task.created_at).getTime()) / 60000;
      return age >= delayThreshold && task.status !== 'completed' && task.status !== 'cancelled';
    })
    .slice(0, 5)
    .forEach((task, i) => {
      const age = Math.round((now - new Date(task.created_at!).getTime()) / 60000);
      alerts.push({
        id: `delay-${task.id}-${i}`,
        type: 'retard',
        title: `Mission ${task.order_number || task.id.slice(0, 8)} en retard`,
        description: `Attente depuis ${age} min · ${task.pickup_commune || 'Zone inconnue'}`,
        count: 1,
        timestamp: `${age} min`,
        severity: age >= 30 ? 'high' : 'medium',
      });
    });

  // Missions en attente
  const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'open_market');
  if (pending.length > 0) {
    const zones = new Set(pending.map((t) => t.pickup_commune || 'Kinshasa'));
    alerts.push({
      id: 'pending-missions',
      type: 'attente',
      title: `${pending.length} mission${pending.length > 1 ? 's' : ''} en attente`,
      description: `${zones.size} zone${zones.size > 1 ? 's' : ''} active${zones.size > 1 ? 's' : ''}`,
      count: pending.length,
      timestamp: 'Maintenant',
      severity: pending.length >= 5 ? 'high' : 'medium',
    });
  }

  // Chauffeurs inactifs
  const inactive = drivers.filter((d) => !d.is_available && d.status !== 'suspended');
  if (inactive.length > 0) {
    alerts.push({
      id: 'inactive-drivers',
      type: 'inactif',
      title: `${inactive.length} chauffeur${inactive.length > 1 ? 's' : ''} occupé${inactive.length > 1 ? 's' : ''}`,
      description: 'Tous les chauffeurs sont en mission',
      count: inactive.length,
      timestamp: 'Maintenant',
      severity: inactive.length >= 3 ? 'high' : 'low',
    });
  }

  return alerts.sort((a, b) => {
    const sevOrder = { high: 3, medium: 2, low: 1 };
    return (sevOrder[b.severity] || 0) - (sevOrder[a.severity] || 0);
  });
};

/* ─── Hook ─── */
export function useRealTimeAlerts({
  interval = 30000,
  enabled = true,
  delayThreshold = 15,
}: UseRealTimeAlertsOptions = {}): UseRealTimeAlertsResult {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tasksResponse, driversResponse] = await Promise.all([
        realApi.getLogisticsTasks({ page: 1, page_size: 100 }),
        realApi.getLogisticsDrivers({ page: 1, page_size: 100 }),
      ]);

      if (!mountedRef.current) return;

      const newAlerts = buildAlertsFromData(
        tasksResponse.tasks || [],
        driversResponse.drivers || [],
        delayThreshold
      );
      setAlerts(newAlerts);
      setLastChecked(new Date());
    } catch {
      // Silently fail - keep existing alerts
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [delayThreshold]);

  const refresh = useCallback(async () => {
    await fetchAlerts();
  }, [fetchAlerts]);

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    connectLogisticsWebSocket();
    const unsubWs = subscribeLogisticsWs(() => {
      void fetchAlerts();
    });

    return () => {
      unsubWs();
      disconnectLogisticsWebSocket();
    };
  }, [enabled, fetchAlerts]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAlerts();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchAlerts]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(fetchAlerts, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, fetchAlerts]);

  const visibleAlerts = alerts.filter((a) => !dismissedIds.has(a.id));
  const criticalCount = visibleAlerts.filter((a) => a.severity === 'high').length;

  return {
    alerts: visibleAlerts,
    criticalCount,
    isLoading,
    lastChecked,
    refresh,
    dismiss,
  };
}

export default useRealTimeAlerts;
