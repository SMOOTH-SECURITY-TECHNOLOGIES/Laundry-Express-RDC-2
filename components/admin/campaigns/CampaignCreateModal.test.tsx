// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CampaignCreateModal } from './CampaignCreateModal';
import { renderComponent, byText } from './test-utils';

describe('CampaignCreateModal', () => {
  it('renders when open', () => {
    const { container } = renderComponent(<CampaignCreateModal open onClose={vi.fn()} onCreate={vi.fn()} />);
    expect(byText(container, 'Nouvelle campagne')).toBeTruthy();
    expect(byText(container, 'Audience')).toBeTruthy();
  });
});
