// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { AdsKpiStrip } from './AdsKpiStrip';
import { renderComponent, byText } from './test-utils';
import type { AdsKpis } from '../../../lib/admin/ads-types';

const sampleKpis: AdsKpis = {
  activeAds: 12,
  activeAdsChange: 20,
  activeAdsSparkline: [10, 11, 12],
  impressions: 246890,
  impressionsChange: 15,
  impressionsSparkline: [200000, 220000, 246890],
  clicks: 8764,
  clicksChange: 18,
  clicksSparkline: [7000, 8000, 8764],
  ctr: 3.55,
  ctrChange: 0.35,
  ctrSparkline: [3.1, 3.3, 3.55],
  conversions: 542,
  conversionsChange: 22,
  conversionsSparkline: [400, 480, 542],
  spend: 2450,
  spendChange: 12,
  spendSparkline: [2000, 2200, 2450],
  roi: 5.8,
  roiChange: 0.6,
  roiSparkline: [5.0, 5.4, 5.8],
};

describe('AdsKpiStrip', () => {
  it('renders all 7 KPI cards from backend data', () => {
    const { container } = renderComponent(<AdsKpiStrip kpis={sampleKpis} />);
    expect(byText(container, 'Publicités actives')).toBeTruthy();
    expect(byText(container, 'Impressions')).toBeTruthy();
    expect(byText(container, 'Clics')).toBeTruthy();
    expect(byText(container, 'CTR')).toBeTruthy();
    expect(byText(container, 'Conversions')).toBeTruthy();
    expect(byText(container, 'Dépenses')).toBeTruthy();
    expect(byText(container, 'ROI')).toBeTruthy();
    expect(container.textContent?.replace(/\s/g, '')).toContain('3.55%');
    expect(container.textContent?.replace(/\s/g, '')).toContain('5.8x');
  });
});
