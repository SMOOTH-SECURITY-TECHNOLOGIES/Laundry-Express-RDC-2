// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { CampaignAutomationsCard } from './CampaignAutomationsCard';
import { renderComponent, byText } from './test-utils';

describe('CampaignAutomationsCard', () => {
  it('renders workflows', () => {
    const { container } = renderComponent(<CampaignAutomationsCard automations={[{ id: '1', name: 'Bienvenue utilisateur', trigger: 'Inscription', status: 'active', conversions: 420, revenue: 8400 }]} />);
    expect(byText(container, 'Bienvenue utilisateur')).toBeTruthy();
  });
});
