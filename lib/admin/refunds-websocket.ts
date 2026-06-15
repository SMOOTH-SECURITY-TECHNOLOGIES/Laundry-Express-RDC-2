import type { RefundWsChannel, RefundWsEvent } from './refunds-types';

export const REFUND_WS_CHANNELS: RefundWsChannel[] = [
  'refund_created',
  'refund_approved',
  'refund_rejected',
  'refund_paid',
  'refund_fraud_detected',
  'refund_leakage_detected',
];

type WsListener = (event: RefundWsEvent) => void;

let ws: WebSocket | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let simIndex = 0;
const listeners = new Set<WsListener>();

const SIMULATED_EVENTS: Array<{ channel: RefundWsChannel; payload: Record<string, unknown> }> = [
  { channel: 'refund_created', payload: { refundId: 'REF-9901', amount: 45 } },
  { channel: 'refund_approved', payload: { refundId: 'REF-8821', amount: 85 } },
  { channel: 'refund_fraud_detected', payload: { refundId: 'REF-8805', risk: 'high' } },
  { channel: 'refund_leakage_detected', payload: { type: 'duplicate', count: 1 } },
  { channel: 'refund_paid', payload: { refundId: 'REF-8810', amount: 65 } },
  { channel: 'refund_rejected', payload: { refundId: 'REF-8800', amount: 38 } },
];

function emit(event: RefundWsEvent): void {
  listeners.forEach((l) => l(event));
  window.dispatchEvent(new CustomEvent('refunds-ws-event', { detail: event }));
}

function getWsUrl(): string | null {
  const url = import.meta.env.VITE_REFUNDS_WS_URL ?? import.meta.env.VITE_FINANCE_WS_URL ?? import.meta.env.VITE_DISPATCHER_WS_URL;
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

export function connectRefundsWebSocket(): void {
  if (typeof window === 'undefined' || ws || pollTimer) return;
  const url = getWsUrl();
  if (!url) { startSimulatedFeed(); return; }
  try {
    ws = new WebSocket(url);
    ws.onmessage = (raw) => {
      try {
        const data = JSON.parse(raw.data as string);
        if (data.channel && REFUND_WS_CHANNELS.includes(data.channel)) {
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

export function disconnectRefundsWebSocket(): void {
  stopSimulatedFeed();
  if (ws) { ws.close(); ws = null; }
}

export function subscribeRefundsWs(listener: WsListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isRefundsWsConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN || pollTimer !== null;
}
