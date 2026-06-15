import type { CommissionWsChannel, CommissionWsEvent } from './commissions-types';

export const COMMISSION_WS_CHANNELS: CommissionWsChannel[] = [
  'commission_generated',
  'commission_paid',
  'commission_due',
  'commission_blocked',
  'commission_disputed',
  'commission_leak_detected',
];

type WsListener = (event: CommissionWsEvent) => void;

let ws: WebSocket | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let simIndex = 0;
const listeners = new Set<WsListener>();

const SIMULATED_EVENTS: Array<{ channel: CommissionWsChannel; payload: Record<string, unknown> }> = [
  { channel: 'commission_generated', payload: { commissionId: 'COM-9901', amount: 45 } },
  { channel: 'commission_paid', payload: { commissionId: 'COM-441', amount: 320 } },
  { channel: 'commission_due', payload: { partnerId: 'P3', amount: 264 } },
  { channel: 'commission_blocked', payload: { commissionId: 'COM-678', partnerId: 'P5' } },
  { channel: 'commission_disputed', payload: { commissionId: 'COM-760', amount: 160 } },
  { channel: 'commission_leak_detected', payload: { type: 'not_generated', count: 1 } },
];

function emit(event: CommissionWsEvent): void {
  listeners.forEach((l) => l(event));
  window.dispatchEvent(new CustomEvent('commissions-ws-event', { detail: event }));
}

function getWsUrl(): string | null {
  const url = import.meta.env.VITE_COMMISSIONS_WS_URL ?? import.meta.env.VITE_FINANCE_WS_URL ?? import.meta.env.VITE_DISPATCHER_WS_URL;
  return typeof url === 'string' && url.length > 0 ? url : null;
}

function startSimulatedFeed(): void {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    const item = SIMULATED_EVENTS[simIndex % SIMULATED_EVENTS.length];
    simIndex += 1;
    emit({ channel: item.channel, payload: item.payload, timestamp: new Date().toISOString() });
  }, 20000);
}

function stopSimulatedFeed(): void {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

export function connectCommissionsWebSocket(): void {
  if (typeof window === 'undefined' || ws || pollTimer) return;
  const url = getWsUrl();
  if (!url) { startSimulatedFeed(); return; }
  try {
    ws = new WebSocket(url);
    ws.onmessage = (raw) => {
      try {
        const data = JSON.parse(raw.data as string);
        if (data.channel && COMMISSION_WS_CHANNELS.includes(data.channel)) {
          emit({ channel: data.channel, payload: data.payload ?? {}, timestamp: data.timestamp ?? new Date().toISOString() });
        }
      } catch { /* ignore */ }
    };
    ws.onclose = () => { ws = null; startSimulatedFeed(); };
    ws.onerror = () => { ws?.close(); ws = null; startSimulatedFeed(); };
  } catch {
    startSimulatedFeed();
  }
}

export function disconnectCommissionsWebSocket(): void {
  stopSimulatedFeed();
  if (ws) { ws.close(); ws = null; }
}

export function subscribeCommissionsWs(listener: WsListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isCommissionsWsConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN || pollTimer !== null;
}
