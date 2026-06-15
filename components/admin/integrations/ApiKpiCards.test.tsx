// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { ApiKpiCards } from './ApiKpiCards';

const kpis = {
  apiCallsToday: 254820, apiCallsTodayChange: 18.6, apiCallsTodaySparkline: [],
  webhooksReceived: 14582, webhooksReceivedChange: 12.4, webhooksReceivedSparkline: [],
  webhooksSent: 22140, webhooksSentChange: 15.3, webhooksSentSparkline: [],
  successRate: 99.2, successRateChange: 1.2, successRateSparkline: [],
  failedEvents: 82, failedEventsChange: 22.5, failedEventsSparkline: [],
  activeIntegrations: 18, activeIntegrationsChange: 2, activeIntegrationsSparkline: [],
  apiKeysCount: 42, apiKeysChange: 4, apiKeysSparkline: [],
  avgResponseTimeMs: 127, avgResponseTimeChange: 18, avgResponseTimeSparkline: [],
};

describe('ApiKpiCards', () => {
  it('renders API calls KPI', () => {
    const { container, unmount } = renderComponent(<ApiKpiCards kpis={kpis} />);
    expect(byText(container, 'API Calls Today')).not.toBeNull();
    expect(container.textContent?.replace(/[\s\u00a0\u202f]/g, '')).toContain('254820');
    unmount();
  });
});
