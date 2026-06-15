// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../hooks/useIntegrationsCenter', () => ({
  default: () => ({
    kpis: {
      apiCallsToday: 254820, apiCallsTodayChange: 18.6, apiCallsTodaySparkline: [],
      webhooksReceived: 14582, webhooksReceivedChange: 12.4, webhooksReceivedSparkline: [],
      webhooksSent: 22140, webhooksSentChange: 15.3, webhooksSentSparkline: [],
      successRate: 99.2, successRateChange: 1.2, successRateSparkline: [],
      failedEvents: 82, failedEventsChange: 22.5, failedEventsSparkline: [],
      activeIntegrations: 18, activeIntegrationsChange: 2, activeIntegrationsSparkline: [],
      apiKeysCount: 42, apiKeysChange: 4, apiKeysSparkline: [],
      avgResponseTimeMs: 127, avgResponseTimeChange: 18, avgResponseTimeSparkline: [],
    },
    apiKeys: [], webhooks: [], webhookDeliveries: [], tracking: [],
    serverSideTracking: { eventsRelayed24h: 18456, successRate: 99.1, failedEvents: 168, queueSize: 42 },
    integrations: [], logs: [], analytics: [], eventDistribution: [], topEndpoints: [],
    security: null, alerts: [], openapi: null, loading: false, error: null, refresh: vi.fn(),
  }),
}));

import { IntegrationsControlCenter } from './IntegrationsControlCenter';

describe('IntegrationsControlCenter', () => {
  beforeEach(() => { (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });

  it('renders API & Webhooks Center header', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<IntegrationsControlCenter />); });
    expect(container.textContent).toContain('API & Webhooks Center');
    await act(async () => root.unmount());
    container.remove();
  });
});
