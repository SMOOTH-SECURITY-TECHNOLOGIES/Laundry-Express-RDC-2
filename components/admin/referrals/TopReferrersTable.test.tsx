// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { TopReferrersTable } from './TopReferrersTable';
import { renderComponent, byText } from './test-utils';

describe('TopReferrersTable', () => {
  it('renders top referrers', () => {
    const { container } = renderComponent(
      <TopReferrersTable referrers={[{
        rank: 1, userId: '1', name: 'Marie K.', email: 'marie@test.com', referralCode: 'MARIE2026',
        referees: 18, conversions: 15, bonusPoints: 7500, revenueGenerated: 4250,
      }]} />,
    );
    expect(byText(container, 'Marie K.')).toBeTruthy();
    expect(byText(container, 'MARIE2026')).toBeTruthy();
  });
});
