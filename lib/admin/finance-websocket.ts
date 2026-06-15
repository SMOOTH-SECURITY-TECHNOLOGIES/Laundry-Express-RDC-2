import type { FinanceWsChannel, FinanceWsEvent } from './finance-types';

export const FINANCE_WS_CHANNELS: FinanceWsChannel[] = [
  'new_payment',
  'new_commission',
  'new_refund',
  'new_invoice',
  'financial_alert',
  'revenue_leak_detected',
];

type WsListener = (event: FinanceWsEvent) => void;

let ws: WebSocket | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let simIndex = 0;
const listeners = new Set<WsListener>();

const SIMULATED_EVENTS: Array<{ channel: FinanceWsChannel; payload: Record<string, unknown> }> = [
  { channel: 'new_payment', payload: { paymentId: 'PAY-9901', amount: 45 } },
  { channel: 'new_commission', payload: { commissionId: 'COM-441', amount: 9 } },
  { channel: 'financial_alert', payload: { message: 'Cash en transit élevé', severity: 'warning' } },
  { channel: 'revenue_leak_detected', payload: { type: 'orphan_payment', count: 1 } },
  { channel: 'new_refund', payload: { refundId: 'REF-552', amount: 28 } },
  { channel: 'new_invoice', payload: { invoiceId: 'INV-778', amount: 62 } },
];

function emit(event: FinanceWsEvent): void {
  listeners.forEach((l) => l(event));
  window.dispatchEvent(new CustomEvent('finance-ws-event', { detail: event }));
}

function getWsUrl(): string | null {
  const url = import.meta.env.VITE_FINANCE_WS_URL ?? import.meta.env.VITE_DISPATCHER_WS_URL;
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

export function connectFinanceWebSocket(): void {
  if (typeof window === 'undefined' || ws || pollTimer) return;
  const url = getWsUrl();
  if (!url) { startSimulatedFeed(); return; }
  try {
    ws = new WebSocket(url);
    ws.onmessage = (raw) => {
      try {
        const data = JSON.parse(raw.data as string);
        if (data.channel && FINANCE_WS_CHANNELS.includes(data.channel)) {
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

export function disconnectFinanceWebSocket(): void {
  stopSimulatedFeed();
  if (ws) { ws.close(); ws = null; }
}

export function subscribeFinanceWs(listener: WsListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isFinanceWsConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN || pollTimer !== null;
}
