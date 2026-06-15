// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { CampaignKpiCards } from './CampaignKpiCards';
import { renderComponent, byText } from './test-utils';
import type { CampaignKpis } from '../../../lib/admin/campaigns-types';

const sample: CampaignKpis = {
  activeCampaigns: 42, activeCampaignsChange: 16.7, activeCampaignsSparkline: [35, 40, 42],
  messagesSent: 184200, messagesSentChange: 24.3, messagesSentSparkline: [160000, 175000, 184200],
  openRate: 54, openRateChange: 5.4, openRateSparkline: [48, 51, 54],
  clickRate: 18, clickRateChange: 3.1, clickRateSparkline: [15, 16, 18],
  conversions: 2940, conversionsChange: 21.8, conversionsSparkline: [2400, 2700, 2940],
  attributedRevenue: 48200, attributedRevenueChange: 18.9, attributedRevenueSparkline: [42000, 45000, 48200],
};

describe('CampaignKpiCards', () => {
  it('renders 6 KPIs without NaN', () => {
    const { container } = renderComponent(<CampaignKpiCards kpis={sample} />);
    expect(byText(container, 'Campagnes actives')).toBeTruthy();
    expect(byText(container, 'Revenus attribués')).toBeTruthy();
    expect(container.textContent).not.toContain('NaN');
  });
});
