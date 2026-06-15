// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AddDriverModal } from './AddDriverModal';
import { renderComponent, byText } from './test-utils';

describe('AddDriverModal', () => {
  it('renders onboarding form', () => {
    const { container } = renderComponent(<AddDriverModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(byText(container, 'Ajouter chauffeur')).toBeTruthy();
    expect(byText(container, 'Moto')).toBeTruthy();
    expect(byText(container, 'Gombe')).toBeTruthy();
  });

  it('does not render when closed', () => {
    const { container } = renderComponent(<AddDriverModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(byText(container, 'Ajouter chauffeur')).toBeFalsy();
  });
});
