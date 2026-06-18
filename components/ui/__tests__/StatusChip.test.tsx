// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { byText, renderComponent } from '../../order-marketplace/test-utils';
import { StatusChip } from '../StatusChip';

describe('StatusChip', () => {
  it('renders with label', () => {
    const view = renderComponent(<StatusChip label="En cours" />);
    expect(byText(view.container, 'En cours')).not.toBeNull();
    view.unmount();
  });

  it('renders with success tone classes', () => {
    const view = renderComponent(<StatusChip label="Livré" tone="success" />);
    const chip = view.container.querySelector('[role="status"]');
    expect(chip?.className).toContain('bg-green-100');
    view.unmount();
  });

  it('renders with info tone classes', () => {
    const view = renderComponent(<StatusChip label="Assigné" tone="info" />);
    const chip = view.container.querySelector('[role="status"]');
    expect(chip?.className).toContain('bg-blue-100');
    view.unmount();
  });

  it('renders with warning tone classes', () => {
    const view = renderComponent(<StatusChip label="Retard" tone="warning" />);
    const chip = view.container.querySelector('[role="status"]');
    expect(chip?.className).toContain('bg-orange-100');
    view.unmount();
  });

  it('renders with danger tone classes', () => {
    const view = renderComponent(<StatusChip label="Échec" tone="danger" />);
    const chip = view.container.querySelector('[role="status"]');
    expect(chip?.className).toContain('bg-red-100');
    view.unmount();
  });

  it('renders with pulse animation', () => {
    const view = renderComponent(<StatusChip label="Live" pulse />);
    const dot = view.container.querySelector('.animate-pulse');
    expect(dot).not.toBeNull();
    view.unmount();
  });

  it('renders with filled variant', () => {
    const view = renderComponent(<StatusChip label="OK" tone="success" variant="filled" />);
    const chip = view.container.querySelector('[role="status"]');
    expect(chip?.className).toContain('bg-green-500');
    view.unmount();
  });

  it('renders with outline variant', () => {
    const view = renderComponent(<StatusChip label="Test" variant="outline" />);
    const chip = view.container.querySelector('[role="status"]');
    expect(chip?.className).toContain('border');
    view.unmount();
  });

  it('renders with xs size', () => {
    const view = renderComponent(<StatusChip label="XS" size="xs" />);
    const chip = view.container.querySelector('[role="status"]');
    expect(chip?.className).toContain('text-[9px]');
    view.unmount();
  });

  it('renders with md size', () => {
    const view = renderComponent(<StatusChip label="MD" size="md" />);
    const chip = view.container.querySelector('[role="status"]');
    expect(chip?.className).toContain('text-xs');
    view.unmount();
  });
});
