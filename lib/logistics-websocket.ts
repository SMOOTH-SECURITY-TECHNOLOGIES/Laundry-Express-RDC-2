import { resolveLogisticsWsUrl } from './ws-url';

export type LogisticsWsChannel =
  | 'task.created'
  | 'task.updated'
  | 'task.assigned'
  | 'task.completed'
  | 'driver.location'
  | 'driver.availability';

export interface LogisticsWsEvent {
  channel: LogisticsWsChannel;
  payload: Record<string, unknown>;
  timestamp: string;
}

type WsListener = (event: LogisticsWsEvent) => void;

let ws: WebSocket | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let simIndex = 0;
let connectionCount = 0;
const listeners = new Set<WsListener>();

const SIMULATED_EVENTS: Array<{ channel: LogisticsWsChannel; payload: Record<string, unknown> }> = [
  { channel: 'driver.location', payload: { driverId: 'drv-001', lat: -4.321, lng: 15.312 } },
  { channel: 'task.assigned', payload: { taskId: 'MSN-004', driverId: 'drv-003' } },
  { channel: 'task.updated', payload: { taskId: 'MSN-011', status: 'in_progress' } },
  { channel: 'driver.availability', payload: { driverId: 'drv-002', isAvailable: false } },
  { channel: 'task.completed', payload: { taskId: 'MSN-014' } },
];

function emit(event: LogisticsWsEvent): void {
  listeners.forEach((listener) => listener(event));
  window.dispatchEvent(new CustomEvent('logistics-ws-event', { detail: event }));
}

function getWsUrl(): string | null {
  return resolveLogisticsWsUrl();
}

export function getLogisticsWsUrl(): string | null {
  return getWsUrl();
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
  }, 20000);
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
    if (!data.channel) return;
    emit({
      channel: data.channel as LogisticsWsChannel,
      payload: data.payload ?? {},
      timestamp: new Date().toISOString(),
    });
  } catch {
    // ignore malformed frames
  }
}

export function connectLogisticsWebSocket(): void {
  if (typeof window === 'undefined') return;
  connectionCount += 1;
  if (connectionCount > 1 || ws || pollTimer) return;

  const url = getWsUrl();
  if (!url) {
    startSimulatedFeed();
    return;
  }

  try {
    ws = new WebSocket(url);
    ws.onmessage = handleWsMessage;
    ws.onclose = () => {
      ws = null;
      startSimulatedFeed();
    };
    ws.onerror = () => {
      if (ws?.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => ws?.close();
      } else {
        ws?.close();
      }
      ws = null;
      startSimulatedFeed();
    };
  } catch {
    startSimulatedFeed();
  }
}

export function disconnectLogisticsWebSocket(): void {
  if (connectionCount > 0) {
    connectionCount -= 1;
  }
  if (connectionCount > 0) return;

  stopSimulatedFeed();
  if (ws) {
    const socket = ws;
    ws = null;
    if (socket.readyState === WebSocket.CONNECTING) {
      socket.onopen = () => socket.close();
    } else if (socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  }
}

export function subscribeLogisticsWs(listener: WsListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isLogisticsWsConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN || pollTimer !== null;
}
