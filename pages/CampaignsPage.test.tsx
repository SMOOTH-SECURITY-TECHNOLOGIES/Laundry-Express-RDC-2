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
  growth: {
    acquisition: 184200,
    activation: 33156,
    conversion: 2940,
    retention: 1284,
    referral: 320,
    revenue: 48200,
    rfmSegments: [{ segment: 'Champions', segmentKey: 'champions', audienceSize: 1284, recencyScore: 5, frequencyScore: 5, monetaryScore: 5, recommendedAction: 'Offre VIP + parrainage' }],
    automations: [{ key: 'reactivation_30', name: 'Réactivation 30 jours', trigger: '30 jours sans commande', channels: ['whatsapp'], eligibleCustomers: 42, status: 'ready', nextAction: 'Coupon automatique' }],
    promoFraudRisks: [{ promoCode: 'VIP50', riskScore: 75, severity: 'high', signals: ['remise_elevee'], recommendedAction: 'suspendre promo' }],
    trendingOffers: [{ id: '1', title: 'Promo Week-End', offerType: 'campaign', score: 82, ctr: 18, conversionRate: 11, revenue: 14200, placements: ['homepage'] }],
    roi: { promoRevenue: 12000, loyaltyRevenue: 8200, referralRevenue: 5400, remarketingRevenue: 4100, reactivationRevenue: 3300, estimatedCac: 2.8, estimatedLtv: 39, estimatedRoi: 5.82 },
    source: 'backend',
  },
  refresh: vi.fn(), handleCreate: vi.fn(), handleUpdate: vi.fn(), handleDelete: vi.fn(),
  handlePause: vi.fn(), handleResume: vi.fn(), handleDuplicate: vi.fn(), handleAnalytics: vi.fn(), handleExport: vi.fn(),
  handlePrepareGrowthAutomation: vi.fn().mockResolvedValue('Workflow préparé'),
  handleReviewGrowthPromoRisk: vi.fn().mockResolvedValue('Risque envoyé en revue'),
  handleSuspendGrowthPromo: vi.fn().mockResolvedValue('Promotion suspendue'),
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
    expect(container.textContent).toContain('Growth Engine');
    expect(container.textContent).toContain('Segments RFM');
    root.unmount();
    container.remove();
  });

  it('renders Growth Engine mode without campaign center header', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => { root.render(<CampaignsControlCenter mode="growth" />); });
    expect(container.textContent).toContain('Growth Engine');
    expect(container.textContent).toContain('Segments RFM');
    expect(container.textContent).toContain('Marketing & AI Growth Platform V1 - P0');
    expect(container.textContent).toContain('Promo Management');
    expect(container.textContent).toContain('Préparer workflow');
    expect(container.textContent).toContain('Suspendre');
    expect(container.textContent).not.toContain('Nouvelle campagne');
    root.unmount();
    container.remove();
  });
});
