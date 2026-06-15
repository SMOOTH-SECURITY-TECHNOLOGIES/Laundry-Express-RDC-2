// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ReferralTrendChart } from './ReferralTrendChart';
import { renderComponent, byText } from './test-utils';

describe('ReferralTrendChart', () => {
  it('renders trend chart title', () => {
    const { container } = renderComponent(
      <ReferralTrendChart
        data={[{ date: '2026-06-01', conversions: 10, revenue: 500 }]}
        days={7}
        onDaysChange={() => {}}
      />,
    );
    expect(byText(container, 'Évolution des conversions')).toBeTruthy();
  });
});
