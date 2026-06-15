// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ReferralWatchlistCard } from './ReferralWatchlistCard';
import { renderComponent, byText } from './test-utils';

describe('ReferralWatchlistCard', () => {
  it('renders watchlist items with severity', () => {
    const { container } = renderComponent(
      <ReferralWatchlistCard items={[{ id: '1', message: 'Codes suspects détectés', count: 3, severity: 'high' }]} />,
    );
    expect(byText(container, 'Codes suspects détectés')).toBeTruthy();
    expect(byText(container, 'high')).toBeTruthy();
  });
});
