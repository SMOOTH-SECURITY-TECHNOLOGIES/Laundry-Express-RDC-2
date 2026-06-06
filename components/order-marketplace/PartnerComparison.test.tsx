// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PartnerComparison } from './PartnerComparison';
import { Partner, PartnerType } from '../../types';
import { buttonByText, byText, renderComponent } from './test-utils';

const partner = (id: string, name: string, rating: number): Partner => ({
  id,
  name,
  slug: id,
  type: PartnerType.PRESSING,
  rating,
  reviewCount: 124,
  imageUrls: [],
  address: 'Gombe, Kinshasa',
  coordinates: { lat: -4.3, lng: 15.3 },
  enabledFeatures: {
    promotions: true,
    financials: true,
    analytics: true,
    customDomain: false,
    customSubdomain: false,
    teamManagement: true,
    apiAccess: false,
    advancedAutomation: false,
    aiReviewAssistant: true,
  },
  currency: 'USD',
});

describe('PartnerComparison', () => {
  it('opens the comparison modal and can choose a partner', async () => {
    const onChoosePartner = vi.fn();
    const view = renderComponent(
      <PartnerComparison
        partners={[
          partner('p1', 'Prestige Pressing', 4.8),
          partner('p2', 'Clean Express', 4.6),
        ]}
        onChoosePartner={onChoosePartner}
      />
    );

    expect(byText(view.container, 'Prestige Pressing')).not.toBeNull();
    view.click(buttonByText(view.container, /comparer/i)!);

    expect(view.container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(byText(view.container, 'Catalogue disponible')).not.toBeNull();

    view.click(buttonByText(view.container, /choisir ce partenaire/i)!);
    expect(onChoosePartner).toHaveBeenCalledWith('p1');
  });
});
