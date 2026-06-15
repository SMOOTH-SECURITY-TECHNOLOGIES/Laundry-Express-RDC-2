// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DisputeTable } from './DisputeTable';
import { renderComponent, byText } from './test-utils';
import { mockDisputeRequests } from '../../../lib/admin/disputes-fixtures';

describe('DisputeTable', () => {
  it('renders dispute rows and CTA', () => {
    const { container } = renderComponent(
      <DisputeTable
        requests={mockDisputeRequests}
        totalCount={148}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onView={vi.fn()}
        readOnly
      />
    );
    expect(byText(container, 'Demandes de remboursement')).toBeTruthy();
    expect(byText(container, 'REF-1487')).toBeTruthy();
    expect(byText(container, 'Marie Kabongo')).toBeTruthy();
    expect(byText(container, 'Voir toutes les demandes (148)')).toBeTruthy();
    expect(container.textContent).not.toMatch(/undefined|null|NaN/);
  });
});
