type PromoWsEvent =
  | { type: 'promo_used'; code: string; revenue: number }
  | { type: 'campaign_conversion'; campaignId: string };

type Listener = (event: PromoWsEvent) => void;

const listeners = new Set<Listener>();
let connected = false;
let simTimer: ReturnType<typeof setInterval> | null = null;

export function isPromotionsWsConnected(): boolean { return connected; }

export function subscribePromotionsWs(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(event: PromoWsEvent): void {
  listeners.forEach((fn) => fn(event));
}

function startSimFeed(): void {
  if (simTimer) return;
  simTimer = setInterval(() => {
    emit({ type: 'promo_used', code: 'FREESHIP', revenue: 42 });
  }, 60000);
}

export function connectPromotionsWebSocket(): void {
  const url = import.meta.env.VITE_PROMOTIONS_WS_URL;
  if (!url) { connected = true; startSimFeed(); return; }
  try {
    const ws = new WebSocket(url);
    ws.onopen = () => { connected = true; };
    ws.onclose = () => { connected = false; startSimFeed(); };
    ws.onmessage = (e) => { try { emit(JSON.parse(e.data)); } catch { /* ignore */ } };
  } catch { connected = true; startSimFeed(); }
}

export function disconnectPromotionsWebSocket(): void {
  connected = false;
  if (simTimer) { clearInterval(simTimer); simTimer = null; }
}
