import type { LeakageAlert } from './revenue-leakage-types';

type LeakageWsEvent =
  | { type: 'leakage_detected'; alert: LeakageAlert }
  | { type: 'case_resolved'; caseId: string }
  | { type: 'commission_missing'; orderId: string };

type Listener = (event: LeakageWsEvent) => void;

const listeners = new Set<Listener>();
let connected = false;
let simTimer: ReturnType<typeof setInterval> | null = null;

const SIM_ALERTS: LeakageAlert[] = [
  { id: 'ws1', message: 'Nouveau paiement orphelin détecté', severity: 'warning', time: 'à l\'instant', caseId: 'CASE-107' },
  { id: 'ws2', message: 'Commission manquante — Clean Express', severity: 'critical', time: 'à l\'instant', caseId: 'CASE-108' },
];

export function isLeakageWsConnected(): boolean { return connected; }

export function subscribeLeakageWs(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(event: LeakageWsEvent): void {
  listeners.forEach((fn) => fn(event));
}

function startSimFeed(): void {
  if (simTimer) return;
  let idx = 0;
  simTimer = setInterval(() => {
    const alert = SIM_ALERTS[idx % SIM_ALERTS.length];
    emit({ type: 'leakage_detected', alert: { ...alert, id: `${alert.id}-${Date.now()}` } });
    idx++;
  }, 45000);
}

export function connectLeakageWebSocket(): void {
  const url = import.meta.env.VITE_LEAKAGE_WS_URL;
  if (!url) {
    connected = true;
    startSimFeed();
    return;
  }
  try {
    const ws = new WebSocket(url);
    ws.onopen = () => { connected = true; };
    ws.onclose = () => { connected = false; startSimFeed(); };
    ws.onmessage = (e) => {
      try { emit(JSON.parse(e.data)); } catch { /* ignore */ }
    };
  } catch {
    connected = true;
    startSimFeed();
  }
}

export function disconnectLeakageWebSocket(): void {
  connected = false;
  if (simTimer) { clearInterval(simTimer); simTimer = null; }
}
