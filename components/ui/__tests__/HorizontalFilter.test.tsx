// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { buttonByText, byText, renderComponent } from '../../order-marketplace/test-utils';
import { HorizontalFilter } from '../HorizontalFilter';

const mockOptions = [
  { key: 'all', label: 'Toutes', count: 10 },
  { key: 'pending', label: 'En attente', count: 3 },
  { key: 'active', label: 'Actives', count: 7 },
];

describe('HorizontalFilter', () => {
  it('renders all options', () => {
    const view = renderComponent(<HorizontalFilter options={mockOptions} activeKey="all" onChange={vi.fn()} />);
    expect(byText(view.container, 'Toutes')).not.toBeNull();
    expect(byText(view.container, 'En attente')).not.toBeNull();
    expect(byText(view.container, 'Actives')).not.toBeNull();
    view.unmount();
  });

  it('calls onChange when option clicked', () => {
    const onChange = vi.fn();
    const view = renderComponent(<HorizontalFilter options={mockOptions} activeKey="all" onChange={onChange} />);
    const btn = buttonByText(view.container, /En attente/)!;
    view.click(btn);
    expect(onChange).toHaveBeenCalledWith('pending');
    view.unmount();
  });

  it('applies active styles to selected option', () => {
    const view = renderComponent(<HorizontalFilter options={mockOptions} activeKey="pending" onChange={vi.fn()} />);
    const activeBtn = buttonByText(view.container, /En attente/)!;
    expect(activeBtn.className).toContain('bg-brand-blue');
    view.unmount();
  });

  it('applies inactive styles to non-selected options', () => {
    const view = renderComponent(<HorizontalFilter options={mockOptions} activeKey="pending" onChange={vi.fn()} />);
    const inactiveBtn = buttonByText(view.container, /Toutes/)!;
    expect(inactiveBtn.className).toContain('bg-surface-muted');
    view.unmount();
  });

  it('renders with underline variant', () => {
    const view = renderComponent(<HorizontalFilter options={mockOptions} activeKey="all" onChange={vi.fn()} variant="underline" />);
    const activeBtn = buttonByText(view.container, /Toutes/)!;
    expect(activeBtn.className).toContain('text-brand-blue');
    view.unmount();
  });
});
