// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ApproveRefundModal } from './ApproveRefundModal';
import { renderComponent, byText } from './test-utils';
import { mockDisputeRequests } from '../../../lib/admin/disputes-fixtures';

describe('ApproveRefundModal', () => {
  it('renders approval form with max amount constraint', () => {
    const dispute = mockDisputeRequests[0];
    const { container } = renderComponent(
      <ApproveRefundModal isOpen dispute={dispute} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(byText(container, 'Approuver le remboursement')).toBeTruthy();
    const amountInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(amountInput?.max).toBe(String(dispute.amount));
  });
});
