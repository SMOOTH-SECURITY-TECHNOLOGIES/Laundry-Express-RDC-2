// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CampaignTrendChart } from './CampaignTrendChart';
import { renderComponent, byText } from './test-utils';

describe('CampaignTrendChart', () => {
  it('renders chart title', () => {
    const { container } = renderComponent(<CampaignTrendChart data={[{ date: '2026-06-01', messages: 100, conversions: 10, revenue: 500 }]} days={7} onDaysChange={vi.fn()} />);
    expect(byText(container, 'Évolution des campagnes')).toBeTruthy();
  });
});
