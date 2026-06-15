// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { EmailCampaignCenter } from './EmailCampaignCenter';

const camp = {
  id: '1', name: 'Promo été', audience: 'Clients actifs', status: 'completed', statusLabel: 'Terminé',
  sentCount: 8420, openedCount: 3240, clickedCount: 820, conversions: 142, revenue: 4280, roi: 3.2,
};

describe('EmailCampaignCenter', () => {
  it('renders campaign center', () => {
    const { container, unmount } = renderComponent(<EmailCampaignCenter campaigns={[camp]} />);
    expect(byText(container, 'Campaign Center')).not.toBeNull();
    expect(container.textContent).toContain('Promo été');
    unmount();
  });
});
