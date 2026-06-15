// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

const mockBundle = {
  kpis: {
    activeCampaigns: 42, activeCampaignsChange: 16.7, activeCampaignsSparkline: [40, 42],
    messagesSent: 184200, messagesSentChange: 24.3, messagesSentSparkline: [180000, 184200],
    openRate: 54, openRateChange: 5.4, openRateSparkline: [52, 54],
    clickRate: 18, clickRateChange: 3.1, clickRateSparkline: [17, 18],
    conversions: 2940, conversionsChange: 21.8, conversionsSparkline: [2800, 2940],
    attributedRevenue: 48200, attributedRevenueChange: 18.9, attributedRevenueSparkline: [47000, 48200],
  },
  campaigns: [{ id: '1', name: 'Promo Week-End', channel: 'whatsapp', audience: 'Actifs', segment: null, status: 'active', messagesSent: 42000, opens: 22800, openRate: 54, clicks: 7560, clickRate: 33, conversions: 840, conversionRate: 11, roi: 6.2, revenue: 14200 }],
  channels: [], funnel: [], trends: [], topCampaigns: [], segments: [], automations: [], calendar: [],
  roi: { budgetSpent: 8280, revenueGenerated: 48200, globalRoi: 5.82, costPerAcquisition: 2.8, customerLifetimeValue: 39, roas: 5.82 },
  watchlist: [], loading: false, error: null, source: 'backend', days: 7,
  refresh: vi.fn(), handleCreate: vi.fn(), handleUpdate: vi.fn(), handleDelete: vi.fn(),
  handlePause: vi.fn(), handleResume: vi.fn(), handleDuplicate: vi.fn(), handleAnalytics: vi.fn(), handleExport: vi.fn(),
};

vi.mock('../lib/admin/campaigns-api', () => ({ trackCampaignEvent: vi.fn(), CAMPAIGNS_WRITE_ENABLED: true }));
vi.mock('../hooks/useCampaignsCenter', () => ({ default: () => mockBundle }));

import { CampaignsControlCenter } from './CampaignsControlCenter';

describe('CampaignsPage', () => {
  beforeEach(() => { (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; });

  it('renders Marketing Campaign Center header', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<CampaignsControlCenter />); });
    expect(container.textContent).toContain('Campagnes');
    expect(container.textContent).toContain('Acquisition');
    root.unmount();
    container.remove();
  });
});
