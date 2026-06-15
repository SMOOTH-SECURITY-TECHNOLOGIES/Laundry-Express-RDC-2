// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CampaignAnalyticsDrawer } from './CampaignAnalyticsDrawer';
import { renderComponent, byText } from './test-utils';

describe('CampaignAnalyticsDrawer', () => {
  it('renders analytics metrics', () => {
    const { container } = renderComponent(
      <CampaignAnalyticsDrawer onClose={vi.fn()} data={{ campaignId: '1', name: 'Promo', messagesSent: 1000, opens: 500, clicks: 100, conversions: 50, revenue: 5000, roi: 5, openRate: 50, clickRate: 20, conversionRate: 50 }} />,
    );
    expect(byText(container, 'Analytics — Promo')).toBeTruthy();
    expect(byText(container, 'ROI')).toBeTruthy();
  });
});
