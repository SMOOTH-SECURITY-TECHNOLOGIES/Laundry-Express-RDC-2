// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CreateZoneModal } from './CreateZoneModal';
import { renderComponent, byText } from './test-utils';

describe('CreateZoneModal', () => {
  it('renders create zone form', () => {
    const { container } = renderComponent(<CreateZoneModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(byText(container, 'Créer zone')).toBeTruthy();
    expect(byText(container, 'Gombe')).toBeTruthy();
  });
});
