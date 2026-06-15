import type { DriverWsChannel, DriverWsEvent } from './drivers-types';

export const DRIVER_WS_CHANNELS: DriverWsChannel[] = [
  'driver.online',
  'driver.offline',
  'driver.location',
  'driver.mission_assigned',
  'driver.mission_started',
  'driver.mission_completed',
  'driver.incident',
];

type WsListener = (event: DriverWsEvent) => void;

let ws: WebSocket | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let simIndex = 0;
const listeners = new Set<WsListener>();

const SIMULATED_EVENTS: Array<{ channel: DriverWsChannel; payload: Record<string, unknown> }> = [
  { channel: 'driver.location', payload: { driverId: 'DRV-01', lat: -4.321, lng: 15.312 } },
  { channel: 'driver.online', payload: { driverId: 'DRV-08', zone: 'Limete' } },
  { channel: 'driver.mission_assigned', payload: { driverId: 'DRV-01', missionId: 'M-7845' } },
  { channel: 'driver.mission_started', payload: { driverId: 'DRV-02', missionId: 'M-7840' } },
  { channel: 'driver.mission_completed', payload: { driverId: 'DRV-04', missionId: 'M-7838' } },
  { channel: 'driver.incident', payload: { driverId: 'DRV-06', type: 'delay' } },
  { channel: 'driver.offline', payload: { driverId: 'DRV-06' } },
];

function emit(event: DriverWsEvent): void {
  listeners.forEach((l) => l(event));
  window.dispatchEvent(new CustomEvent('drivers-ws-event', { detail: event }));
}

function getWsUrl(): string | null {
  const url = import.meta.env.VITE_DRIVERS_WS_URL ?? import.meta.env.VITE_DISPATCHER_WS_URL;
  return typeof url === 'string' && url.length > 0 ? url : null;
}

function startSimulatedFeed(): void {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    const item = SIMULATED_EVENTS[simIndex % SIMULATED_EVENTS.length];
    simIndex += 1;
    emit({ channel: item.channel, payload: item.payload, timestamp: new Date().toISOString() });
  }, 15000);
}

function stopSimulatedFeed(): void {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

export function connectDriversWebSocket(): void {
  if (typeof window === 'undefined' || ws || pollTimer) return;
  const url = getWsUrl();
  if (!url) { startSimulatedFeed(); return; }
  try {
    ws = new WebSocket(url);
    ws.onmessage = (raw) => {
      try {
        const data = JSON.parse(String(raw.data)) as { channel?: string; payload?: Record<string, unknown> };
        if (!data.channel || !DRIVER_WS_CHANNELS.includes(data.channel as DriverWsChannel)) return;
        emit({ channel: data.channel as DriverWsChannel, payload: data.payload ?? {}, timestamp: new Date().toISOString() });
      } catch { /* ignore */ }
    };
    ws.onerror = () => { ws?.close(); ws = null; startSimulatedFeed(); };
    ws.onclose = () => { ws = null; startSimulatedFeed(); };
  } catch { startSimulatedFeed(); }
}

export function disconnectDriversWebSocket(): void {
  stopSimulatedFeed();
  if (ws) { ws.close(); ws = null; }
}

export function subscribeDriversWs(listener: WsListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isDriversWsConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN || pollTimer !== null;
}
