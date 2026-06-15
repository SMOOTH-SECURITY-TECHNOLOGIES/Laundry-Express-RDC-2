import { useState, useEffect, useCallback } from 'react';
import {
  fetchZonesBundle,
  invalidateZonesCache,
  createZone,
  updateZoneTariff,
  deleteZone,
  exportZonesData,
  ZONES_DEGRADED_MODE,
} from '../lib/admin/zones-api';
import type {
  Zone,
  ZoneKpis,
  ZoneDistribution,
  ZoneEtaEntry,
  ZoneAlert,
  ZoneHeatmap,
  ZoneDispatcherSnapshot,
  ZoneTruthAnomaly,
  ZoneSlaSummary,
  CreateZonePayload,
} from '../lib/admin/zones-types';

interface UseZonesCenterReturn {
  kpis: ZoneKpis | null;
  zones: Zone[];
  distribution: ZoneDistribution[];
  etaAnalytics: ZoneEtaEntry[];
  alerts: ZoneAlert[];
  heatmap: ZoneHeatmap | null;
  dispatcherSnapshots: ZoneDispatcherSnapshot[];
  truthAnomalies: ZoneTruthAnomaly[];
  slaSummary: ZoneSlaSummary | null;
  loading: boolean;
  error: string | null;
  degraded: boolean;
  refresh: () => Promise<void>;
  handleCreateZone: (payload: CreateZonePayload) => Promise<void>;
  handleUpdateTariff: (zoneId: string) => Promise<void>;
  handleDeleteZone: (zoneId: string) => Promise<void>;
  handleExport: (format: 'csv' | 'excel' | 'pdf') => Promise<{ filename: string; count: number }>;
}

export default function useZonesCenter(): UseZonesCenterReturn {
  const [kpis, setKpis] = useState<ZoneKpis | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [distribution, setDistribution] = useState<ZoneDistribution[]>([]);
  const [etaAnalytics, setEtaAnalytics] = useState<ZoneEtaEntry[]>([]);
  const [alerts, setAlerts] = useState<ZoneAlert[]>([]);
  const [heatmap, setHeatmap] = useState<ZoneHeatmap | null>(null);
  const [dispatcherSnapshots, setDispatcherSnapshots] = useState<ZoneDispatcherSnapshot[]>([]);
  const [truthAnomalies, setTruthAnomalies] = useState<ZoneTruthAnomaly[]>([]);
  const [slaSummary, setSlaSummary] = useState<ZoneSlaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);

  const applyBundle = useCallback((bundle: Awaited<ReturnType<typeof fetchZonesBundle>>) => {
    setKpis(bundle.kpis);
    setZones(bundle.zones);
    setDistribution(bundle.distribution);
    setEtaAnalytics(bundle.etaAnalytics);
    setAlerts(bundle.alerts);
    setHeatmap(bundle.heatmap);
    setDispatcherSnapshots(bundle.dispatcherSnapshots);
    setTruthAnomalies(bundle.truthAnomalies);
    setSlaSummary(bundle.slaSummary);
    setDegraded(bundle.degraded || ZONES_DEGRADED_MODE);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      invalidateZonesCache();
      applyBundle(await fetchZonesBundle());
    } catch {
      setError('Impossible de charger les zones.');
    } finally {
      setLoading(false);
    }
  }, [applyBundle]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const onRefresh = () => loadData();
    window.addEventListener('admin-zones-refresh', onRefresh);
    return () => window.removeEventListener('admin-zones-refresh', onRefresh);
  }, [loadData]);

  const refresh = useCallback(async () => { await loadData(); }, [loadData]);

  return {
    kpis, zones, distribution, etaAnalytics, alerts, heatmap, dispatcherSnapshots,
    truthAnomalies, slaSummary, loading, error, degraded, refresh,
    handleCreateZone: async (p) => { await createZone(p); await refresh(); },
    handleUpdateTariff: async (id) => { await updateZoneTariff(id); await refresh(); },
    handleDeleteZone: async (id) => { await deleteZone(id); await refresh(); },
    handleExport: exportZonesData,
  };
}
