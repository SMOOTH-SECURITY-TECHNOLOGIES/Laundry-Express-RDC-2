// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ReferralCampaignModal } from './ReferralCampaignModal';
import { renderComponent, byText } from './test-utils';

describe('ReferralCampaignModal', () => {
  it('renders when open', () => {
    const { container } = renderComponent(
      <ReferralCampaignModal open onClose={() => {}} onCreate={() => {}} />,
    );
    expect(byText(container, 'Créer campagne parrainage')).toBeTruthy();
  });

  it('does not render when closed', () => {
    const { container } = renderComponent(
      <ReferralCampaignModal open={false} onClose={() => {}} onCreate={() => {}} />,
    );
    expect(container.textContent).toBe('');
  });
});
