import type { DispatcherWsChannel, DispatcherWsEvent } from './dispatcher-types';

export const DISPATCHER_WS_CHANNELS: DispatcherWsChannel[] = [
  'mission.created',
  'mission.assigned',
  'mission.started',
  'mission.pickup',
  'mission.delivery',
  'mission.completed',
  'mission.cancelled',
  'driver.online',
  'driver.offline',
  'driver.location',
  'sla.breach',
  'incident.created',
];

type WsListener = (event: DispatcherWsEvent) => void;

let ws: WebSocket | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let simIndex = 0;
const listeners = new Set<WsListener>();

const SIMULATED_EVENTS: Array<{ channel: DispatcherWsChannel; payload: Record<string, unknown> }> = [
  { channel: 'driver.location', payload: { driverId: 'DRV-01', lat: -4.321, lng: 15.312 } },
  { channel: 'mission.started', payload: { missionId: 'M-7839', driverId: 'DRV-01' } },
  { channel: 'mission.pickup', payload: { missionId: 'M-7840', driverId: 'DRV-02' } },
  { channel: 'sla.breach', payload: { missionId: 'M-7841', orderId: 'ORD-12841' } },
  { channel: 'driver.online', payload: { driverId: 'DRV-08', zone: 'Limete' } },
  { channel: 'incident.created', payload: { incidentId: 'INC-005', type: 'late_pickup' } },
  { channel: 'mission.delivery', payload: { missionId: 'M-7842', driverId: 'DRV-04' } },
  { channel: 'mission.completed', payload: { missionId: 'M-7838', driverId: 'DRV-05' } },
];

function emit(event: DispatcherWsEvent): void {
  listeners.forEach((listener) => listener(event));
  window.dispatchEvent(new CustomEvent('dispatcher-ws-event', { detail: event }));
}

function getWsUrl(): string | null {
  const url = import.meta.env.VITE_DISPATCHER_WS_URL;
  return typeof url === 'string' && url.length > 0 ? url : null;
}

function startSimulatedFeed(): void {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    const item = SIMULATED_EVENTS[simIndex % SIMULATED_EVENTS.length];
    simIndex += 1;
    emit({
      channel: item.channel,
      payload: item.payload,
      timestamp: new Date().toISOString(),
    });
  }, 15000);
}

function stopSimulatedFeed(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function handleWsMessage(raw: MessageEvent): void {
  try {
    const data = JSON.parse(String(raw.data)) as { channel?: string; payload?: Record<string, unknown> };
    if (!data.channel || !DISPATCHER_WS_CHANNELS.includes(data.channel as DispatcherWsChannel)) return;
    emit({
      channel: data.channel as DispatcherWsChannel,
      payload: data.payload ?? {},
      timestamp: new Date().toISOString(),
    });
  } catch {
    // ignore malformed frames
  }
}

export function connectDispatcherWebSocket(): void {
  if (typeof window === 'undefined') return;
  if (ws || pollTimer) return;

  const url = getWsUrl();
  if (!url) {
    startSimulatedFeed();
    return;
  }

  try {
    ws = new WebSocket(url);
    ws.onmessage = handleWsMessage;
    ws.onerror = () => {
      ws?.close();
      ws = null;
      startSimulatedFeed();
    };
    ws.onclose = () => {
      ws = null;
      startSimulatedFeed();
    };
  } catch {
    startSimulatedFeed();
  }
}

export function disconnectDispatcherWebSocket(): void {
  stopSimulatedFeed();
  if (ws) {
    ws.close();
    ws = null;
  }
}

export function subscribeDispatcherWs(listener: WsListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isDispatcherWsConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN || pollTimer !== null;
}
