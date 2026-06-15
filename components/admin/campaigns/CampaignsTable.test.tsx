// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CampaignsTable } from './CampaignsTable';
import { renderComponent, byText } from './test-utils';

describe('CampaignsTable', () => {
  it('renders campaign rows', () => {
    const { container } = renderComponent(
      <CampaignsTable campaigns={[{ id: '1', name: 'Promo Week-End', channel: 'whatsapp', audience: 'Clients actifs', segment: null, status: 'active', messagesSent: 42000, opens: 22800, openRate: 54, clicks: 7560, clickRate: 33, conversions: 840, conversionRate: 11, roi: 6.2, revenue: 14200 }]} onEdit={vi.fn()} onPause={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} onAnalytics={vi.fn()} />,
    );
    expect(byText(container, 'Promo Week-End')).toBeTruthy();
    expect(byText(container, 'Actif')).toBeTruthy();
  });
});
