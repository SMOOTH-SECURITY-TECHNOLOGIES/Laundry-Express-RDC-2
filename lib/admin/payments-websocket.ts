import type { PaymentWsChannel, PaymentWsEvent } from './payments-types';

export const PAYMENT_WS_CHANNELS: PaymentWsChannel[] = [
  'payment_received', 'payment_failed', 'payment_pending', 'payment_refunded', 'payment_fraud_detected', 'reconciliation_gap',
];

type WsListener = (event: PaymentWsEvent) => void;

let ws: WebSocket | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let simIndex = 0;
const listeners = new Set<WsListener>();

const SIMULATED: Array<{ channel: PaymentWsChannel; payload: Record<string, unknown> }> = [
  { channel: 'payment_received', payload: { paymentId: 'PAY-9902', amount: 45 } },
  { channel: 'payment_failed', payload: { paymentId: 'PAY-9895', error: 'Carte expirée' } },
  { channel: 'payment_pending', payload: { paymentId: 'PAY-9900', amount: 32 } },
  { channel: 'payment_fraud_detected', payload: { paymentId: 'PAY-9880', score: 72 } },
  { channel: 'reconciliation_gap', payload: { type: 'orphan_payment', count: 1 } },
];

function emit(event: PaymentWsEvent): void {
  listeners.forEach((l) => l(event));
  window.dispatchEvent(new CustomEvent('payments-ws-event', { detail: event }));
}

function getWsUrl(): string | null {
  const url = import.meta.env.VITE_PAYMENTS_WS_URL ?? import.meta.env.VITE_FINANCE_WS_URL;
  return typeof url === 'string' && url.length > 0 ? url : null;
}

function startSimulatedFeed(): void {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    const item = SIMULATED[simIndex % SIMULATED.length];
    simIndex += 1;
    emit({ channel: item.channel, payload: item.payload, timestamp: new Date().toISOString() });
  }, 20000);
}

export function connectPaymentsWebSocket(): void {
  if (typeof window === 'undefined' || ws || pollTimer) return;
  const url = getWsUrl();
  if (!url) { startSimulatedFeed(); return; }
  try {
    ws = new WebSocket(url);
    ws.onmessage = (raw) => {
      try {
        const data = JSON.parse(raw.data as string);
        if (data.channel && PAYMENT_WS_CHANNELS.includes(data.channel)) {
          emit({ channel: data.channel, payload: data.payload ?? {}, timestamp: data.timestamp ?? new Date().toISOString() });
        }
      } catch { /* ignore */ }
    };
    ws.onclose = () => { ws = null; startSimulatedFeed(); };
    ws.onerror = () => { ws?.close(); ws = null; startSimulatedFeed(); };
  } catch { startSimulatedFeed(); }
}

export function disconnectPaymentsWebSocket(): void {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (ws) { ws.close(); ws = null; }
}

export function subscribePaymentsWs(listener: WsListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isPaymentsWsConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN || pollTimer !== null;
}
