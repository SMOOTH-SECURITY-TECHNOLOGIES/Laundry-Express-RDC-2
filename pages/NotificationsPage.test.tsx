// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

vi.mock('../hooks/useNotificationsCenter', () => ({
  default: () => ({
    kpis: {
      totalSent: 124580, totalSentChange: 18.6, totalSentSparkline: [],
      deliveryRate: 98.7, deliveryRateChange: 2.3, deliveryRateSparkline: [],
      emailOpenRate: 32.4, emailOpenRateChange: 4.1, emailOpenRateSparkline: [],
      clickRate: 8.6, clickRateChange: 1.2, clickRateSparkline: [],
      unsubscribes: 245, unsubscribesChange: -5.4, unsubscribesSparkline: [],
      errors: 1248, errorsChange: 12.7, errorsSparkline: [],
    },
    notifications: [{ id: '1', title: 'Test', messagePreview: 'msg', channel: 'push', channelLabel: 'Push', eventType: 'promotion', eventLabel: 'Promotion', audience: 'Clients', status: 'delivered', statusLabel: 'Livré', sentAt: null, deliveryRate: 100 }],
    channelDistribution: [], deliveryStatus: [], topEvents: [], channelPerformance: [],
    popularTemplates: [], automations: [], activities: [], providerHealth: [], errors: [],
    unsubscribes: [], segments: [], templates: [],
    loading: false, error: null, days: 30,
    refresh: vi.fn(), handleSend: vi.fn(), handleRetry: vi.fn(), handleCreateTemplate: vi.fn(), handleExport: vi.fn(),
  }),
}));

import { NotificationsControlCenter } from './NotificationsControlCenter';

describe('NotificationsControlCenter', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('renders notifications header', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<NotificationsControlCenter />); });
    expect(container.textContent).toContain('Notifications');
    expect(container.textContent).toContain('Total envoyées');
    root.unmount();
  });
});
