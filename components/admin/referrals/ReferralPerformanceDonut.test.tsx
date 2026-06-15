// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ReferralPerformanceDonut } from './ReferralPerformanceDonut';
import { renderComponent, byText } from './test-utils';

const channels = [
  { channel: 'WhatsApp', percent: 46, conversions: 156, roi: 7.2, color: '#25D366' },
  { channel: 'Email', percent: 22, conversions: 72, roi: 6.1, color: '#8B5CF6' },
];

describe('ReferralPerformanceDonut', () => {
  it('renders revenue center and channels', () => {
    const { container } = renderComponent(
      <ReferralPerformanceDonut channels={channels} totalRevenue={24850} />,
    );
    expect(byText(container, 'Performance du programme')).toBeTruthy();
    expect(byText(container, 'Revenus générés')).toBeTruthy();
    expect(byText(container, 'WhatsApp')).toBeTruthy();
  });
});
