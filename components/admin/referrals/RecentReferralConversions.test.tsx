// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { RecentReferralConversions } from './RecentReferralConversions';
import { renderComponent, byText } from './test-utils';

describe('RecentReferralConversions', () => {
  it('renders conversion statuses', () => {
    const { container } = renderComponent(
      <RecentReferralConversions conversions={[{
        id: '1', refereeName: 'Jean D.', refereeEmail: 'jean@test.com', orderId: 'ORD-1',
        date: '2026-06-07', discountUsed: 5, status: 'converted',
      }]} />,
    );
    expect(byText(container, 'Jean D.')).toBeTruthy();
    expect(byText(container, 'Converti')).toBeTruthy();
  });
});
