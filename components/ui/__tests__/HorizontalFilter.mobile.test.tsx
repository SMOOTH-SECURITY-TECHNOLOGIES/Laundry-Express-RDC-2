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

describe('HorizontalFilter Mobile', () => {
  describe('Responsive rendering', () => {
    it('renders correctly at 360px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 360, writable: true });
      const view = renderComponent(<HorizontalFilter options={mockOptions} activeKey="all" onChange={vi.fn()} />);
      expect(byText(view.container, 'Toutes')).not.toBeNull();
      expect(byText(view.container, 'En attente')).not.toBeNull();
      expect(byText(view.container, 'Actives')).not.toBeNull();
      view.unmount();
    });

    it('renders correctly at 390px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 390, writable: true });
      const view = renderComponent(<HorizontalFilter options={mockOptions} activeKey="all" onChange={vi.fn()} />);
      expect(byText(view.container, 'Toutes')).not.toBeNull();
      view.unmount();
    });

    it('renders correctly at 430px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 430, writable: true });
      const view = renderComponent(<HorizontalFilter options={mockOptions} activeKey="all" onChange={vi.fn()} />);
      expect(byText(view.container, 'Toutes')).not.toBeNull();
      view.unmount();
    });
  });

  describe('Touch targets', () => {
    it('has touch-friendly padding for filter buttons', () => {
      const view = renderComponent(<HorizontalFilter options={mockOptions} activeKey="all" onChange={vi.fn()} />);
      const buttons = view.container.querySelectorAll('button');
      buttons.forEach((btn) => {
        // Check for padding classes that provide touch targets
        expect(btn.className).toMatch(/px-\d+|py-\d+/);
      });
      view.unmount();
    });
  });

  describe('Scroll behavior', () => {
    it('renders scrollable container', () => {
      const view = renderComponent(<HorizontalFilter options={mockOptions} activeKey="all" onChange={vi.fn()} />);
      const container = view.container.querySelector('.overflow-x-auto');
      expect(container).not.toBeNull();
      view.unmount();
    });
  });

  describe('Active state', () => {
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
  });

  describe('Counts', () => {
    it('shows counts when showCounts=true', () => {
      const view = renderComponent(<HorizontalFilter options={mockOptions} activeKey="all" onChange={vi.fn()} showCounts />);
      expect(byText(view.container, '10')).not.toBeNull();
      expect(byText(view.container, '3')).not.toBeNull();
      view.unmount();
    });

    it('hides counts when showCounts=false', () => {
      const view = renderComponent(<HorizontalFilter options={mockOptions} activeKey="all" onChange={vi.fn()} showCounts={false} />);
      expect(byText(view.container, '10')).toBeNull();
      view.unmount();
    });
  });

  describe('Click behavior', () => {
    it('calls onChange when option clicked', () => {
      const onChange = vi.fn();
      const view = renderComponent(<HorizontalFilter options={mockOptions} activeKey="all" onChange={onChange} />);
      const btn = buttonByText(view.container, /En attente/)!;
      view.click(btn);
      expect(onChange).toHaveBeenCalledWith('pending');
      view.unmount();
    });
  });

  describe('Variants', () => {
    it('renders with underline variant', () => {
      const view = renderComponent(<HorizontalFilter options={mockOptions} activeKey="all" onChange={vi.fn()} variant="underline" />);
      const activeBtn = buttonByText(view.container, /Toutes/)!;
      expect(activeBtn.className).toContain('text-brand-blue');
      view.unmount();
    });
  });
});
