import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { fetchActivityLogBundle, getActivityLogWsUrl, invalidateActivityLogCache } from '../lib/admin/activity-log-api';
import type { ActivityLogDashboardSummary, ActivityLogEvent } from '../lib/admin/activity-log-types';

export default function useActivityLogCenter() {
  const { user, isLoading: authLoading } = useAppContext();
  const [data, setData] = useState<ActivityLogDashboardSummary | null>(null);
  const [liveEvents, setLiveEvents] = useState<ActivityLogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const bundle = await fetchActivityLogBundle(200);
      setData(bundle);
      setLiveEvents(bundle.liveEvents);
    }
    catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401) setError('Session expirée ou invalide. Reconnectez-vous.');
      else setError('Impossible de charger le journal admin.');
    }
    finally { setLoading(false); }
  }, []);

  const refresh = useCallback(async () => { invalidateActivityLogCache(); await loadData(); }, [loadData]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) { setLoading(false); setError('Session requise.'); return; }
    if (token.startsWith('TOKEN-')) { setLoading(false); setError('Session mock incompatible.'); return; }
    if (authLoading) return;
    if (!user) { setLoading(false); setError('Session requise.'); return; }
    loadData();
  }, [user, authLoading, loadData]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token || token.startsWith('TOKEN-') || !user || error || loading) return;

    let cancelled = false;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(getActivityLogWsUrl());
      wsRef.current = ws;
      ws.onerror = () => { /* live feed optional */ };
      ws.onmessage = (msg) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(msg.data as string) as { type: string; events?: Array<Record<string, unknown>> };
          if (!payload.events?.length) return;
          setLiveEvents((prev) => {
            const mapped = payload.events!.map((raw) => ({
              id: String(raw.id),
              eventId: String(raw.event_id ?? raw.eventId ?? ''),
              occurredAt: (raw.occurred_at ?? raw.occurredAt) as string | undefined,
              actorType: String(raw.actor_type ?? raw.actorType ?? ''),
              actorTypeLabel: String(raw.actor_type_label ?? raw.actorTypeLabel ?? ''),
              actorName: String(raw.actor_name ?? raw.actorName ?? ''),
              action: String(raw.action ?? ''),
              actionLabel: raw.action_label as string | undefined,
              description: raw.description as string | undefined,
              resourceType: String(raw.resource_type ?? raw.resourceType ?? ''),
              reference: raw.reference as string | undefined,
              corridor: String(raw.corridor ?? ''),
              corridorLabel: String(raw.corridor_label ?? raw.corridorLabel ?? ''),
              severity: String(raw.severity ?? 'info'),
              severityLabel: String(raw.severity_label ?? raw.severityLabel ?? ''),
              status: String(raw.status ?? 'success'),
              statusLabel: String(raw.status_label ?? raw.statusLabel ?? ''),
              corridorsImpacted: (raw.corridors_impacted ?? raw.corridorsImpacted ?? []) as string[],
              isAnomaly: Boolean(raw.is_anomaly ?? raw.isAnomaly),
            }));
            return [...mapped, ...prev].slice(0, 8);
          });
        } catch { /* ignore malformed payload */ }
      };
    } catch { /* ws unavailable */ }

    return () => {
      cancelled = true;
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
      wsRef.current = null;
    };
  }, [user, error, loading]);

  return {
    kpis: data?.kpis ?? null,
    events: data?.events ?? [],
    liveEvents,
    anomalies: data?.anomalies ?? [],
    heatmap: data?.heatmap ?? [],
    topActivities: data?.topActivities ?? [],
    corridorHealth: data?.corridorHealth ?? [],
    actorDistribution: data?.actorDistribution ?? [],
    severityDistribution: data?.severityDistribution ?? [],
    total: data?.total ?? 0,
    sensitiveAccess: data?.sensitiveAccess ?? false,
    readOnly: data?.readOnly ?? true,
    loading, error, refresh,
  };
}
