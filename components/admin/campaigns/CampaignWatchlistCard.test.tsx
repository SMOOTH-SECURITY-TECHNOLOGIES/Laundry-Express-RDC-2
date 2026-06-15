// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { CampaignWatchlistCard } from './CampaignWatchlistCard';
import { renderComponent, byText } from './test-utils';

describe('CampaignWatchlistCard', () => {
  it('renders alerts with severity', () => {
    const { container } = renderComponent(<CampaignWatchlistCard items={[{ id: '1', message: 'Faible taux ouverture', count: 2, severity: 'high' }]} />);
    expect(byText(container, 'Faible taux ouverture')).toBeTruthy();
    expect(byText(container, 'high')).toBeTruthy();
  });
});
