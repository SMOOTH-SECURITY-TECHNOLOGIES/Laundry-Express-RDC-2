/**
 * Helpers pour construire des URLs WebSocket à partir d'une base API HTTP(S).
 */

export function httpBaseToWsBase(httpUrl: string): string {
  return httpUrl.replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://');
}

export function appendAuthToken(url: string, token: string): string {
  if (!token || url.includes('token=')) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

/** Construit une URL WS à partir d'une base API (ex. https://api.example.com/api/v1). */
export function buildWsUrlFromApiBase(apiBase: string, wsPath: string, token = ''): string {
  const normalizedBase = apiBase.replace(/\/$/, '');
  const normalizedPath = wsPath.startsWith('/') ? wsPath : `/${wsPath}`;
  const wsBase = /^wss?:\/\//i.test(normalizedBase)
    ? normalizedBase
    : httpBaseToWsBase(normalizedBase);
  return appendAuthToken(`${wsBase}${normalizedPath}`, token);
}

export interface ResolveLogisticsWsUrlOptions {
  explicitUrl?: string;
  apiBaseUrl?: string;
  apiUrl?: string;
  token?: string;
  mode?: string;
  windowAvailable?: boolean;
  windowProtocol?: string;
  windowHost?: string;
}

/**
 * Résout l'URL du flux logistique live.
 * Priorité : VITE_LOGISTICS_WS_URL > base absolue > proxy relatif > VITE_API_URL.
 */
export function resolveLogisticsWsUrl(options: ResolveLogisticsWsUrlOptions = {}): string | null {
  const {
    explicitUrl = import.meta.env.VITE_LOGISTICS_WS_URL,
    apiBaseUrl = import.meta.env.VITE_API_BASE_URL,
    apiUrl = import.meta.env.VITE_API_URL,
    token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '',
    mode = import.meta.env.MODE,
    windowAvailable = typeof window !== 'undefined',
    windowProtocol = typeof window !== 'undefined' ? window.location.protocol : 'http:',
    windowHost = typeof window !== 'undefined' ? window.location.host : 'localhost',
  } = options;

  if (typeof explicitUrl === 'string' && explicitUrl.length > 0) {
    return appendAuthToken(explicitUrl, token);
  }

  if (mode === 'test' || !windowAvailable) {
    return null;
  }

  if (typeof apiBaseUrl === 'string' && apiBaseUrl.startsWith('http')) {
    return buildWsUrlFromApiBase(apiBaseUrl, '/logistics/live', token);
  }

  if (typeof apiBaseUrl === 'string' && apiBaseUrl.startsWith('/')) {
    const proto = windowProtocol === 'https:' ? 'wss:' : 'ws:';
    return appendAuthToken(`${proto}//${windowHost}${apiBaseUrl}/logistics/live`, token);
  }

  if (typeof apiUrl === 'string' && apiUrl.length > 0) {
    return buildWsUrlFromApiBase(apiUrl, '/logistics/live', token);
  }

  return null;
}
