// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RejectRefundModal } from './RejectRefundModal';
import { renderComponent, byText } from './test-utils';
import { mockDisputeRequests } from '../../../lib/admin/disputes-fixtures';

describe('RejectRefundModal', () => {
  it('requires rejection reason and client message', () => {
    const { container } = renderComponent(
      <RejectRefundModal
        isOpen
        dispute={mockDisputeRequests[0]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(byText(container, 'Rejeter la demande')).toBeTruthy();
    const requiredFields = container.querySelectorAll('[required]');
    expect(requiredFields.length).toBeGreaterThanOrEqual(2);
  });
});
