// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../hooks/useEmailCenter', () => ({
  default: () => ({
    kpis: { sentToday: 18420, sentTodayChange: 15.8, sentTodaySparkline: [], deliveryRate: 99.1, deliveryRateChange: 0.4, deliveryRateSparkline: [], openRate: 38.4, openRateChange: 2.1, openRateSparkline: [], clickRate: 9.2, clickRateChange: 1.4, clickRateSparkline: [], bounces: 214, bouncesChange: -12, bouncesSparkline: [], unsubscribes: 86, unsubscribesChange: 3.2, unsubscribesSparkline: [], activeTemplates: 42, activeTemplatesChange: 2, activeTemplatesSparkline: [], attributedRevenue: 12850, attributedRevenueChange: 18.5, attributedRevenueSparkline: [] },
    messages: [], templates: [], campaigns: [], automations: [], typeDistribution: [], domainPerformance: [], deliverability: [],
    bounces: [], unsubscribeSummary: { total: 86, campaign: 24, marketing: 62, preferencesCount: 142 }, unsubscribes: [],
    invoiceSummary: { sent: 12400, opened: 8840, downloaded: 6200, reminders: 420, failures: 18 }, invoices: [],
    webhooks: [], alerts: [], analytics: [], settings: { provider: 'resend', fromEmail: 'noreply@laundryexpress.cd', replyTo: 'support@laundryexpress.cd', marketingOptOutRequired: true },
    loading: false, error: null, refresh: vi.fn(), handleExport: vi.fn(),
  }),
}));

import { EmailControlCenter } from './EmailControlCenter';

describe('EmailControlCenter', () => {
  beforeEach(() => { (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });

  it('renders Email Center header', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<EmailControlCenter />); });
    expect(container.textContent).toContain('Email Center');
    await act(async () => root.unmount());
    container.remove();
  });
});
