// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DisputeDetailDrawer } from './DisputeDetailDrawer';
import { renderComponent, byText } from './test-utils';
import { mockDisputeRequests } from '../../../lib/admin/disputes-fixtures';

describe('DisputeDetailDrawer', () => {
  it('renders dispute detail when open', () => {
    const dispute = mockDisputeRequests[0];
    const { container } = renderComponent(
      <DisputeDetailDrawer
        isOpen
        dispute={dispute}
        onClose={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        readOnly
      />
    );
    expect(byText(container, 'REF-1487')).toBeTruthy();
    expect(byText(container, 'Marie Kabongo')).toBeTruthy();
    expect(byText(container, 'Mode lecture seule')).toBeTruthy();
  });

  it('returns null when closed', () => {
    const { container } = renderComponent(
      <DisputeDetailDrawer
        isOpen={false}
        dispute={mockDisputeRequests[0]}
        onClose={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(container.textContent).toBe('');
  });
});
