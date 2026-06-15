// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CreateDisputeModal } from './CreateDisputeModal';
import { renderComponent, byText } from './test-utils';

describe('CreateDisputeModal', () => {
  it('renders form fields when open', () => {
    const { container } = renderComponent(
      <CreateDisputeModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(byText(container, 'Nouveau litige')).toBeTruthy();
    expect(container.querySelector('input')).toBeTruthy();
  });

  it('returns null when closed', () => {
    const { container } = renderComponent(
      <CreateDisputeModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(container.textContent).toBe('');
  });
});
