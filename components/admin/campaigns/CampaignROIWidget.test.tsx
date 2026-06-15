// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { CampaignROIWidget } from './CampaignROIWidget';
import { renderComponent, byText } from './test-utils';

describe('CampaignROIWidget', () => {
  it('renders ROI global', () => {
    const { container } = renderComponent(<CampaignROIWidget roi={{ budgetSpent: 8280, revenueGenerated: 48200, globalRoi: 5.82, costPerAcquisition: 2.8, customerLifetimeValue: 39, roas: 5.82 }} />);
    expect(byText(container, 'ROI global')).toBeTruthy();
    expect(byText(container, '5.82x')).toBeTruthy();
  });
});
