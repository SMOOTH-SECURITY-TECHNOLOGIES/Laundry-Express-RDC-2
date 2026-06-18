// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { buttonByText, byText, renderComponent } from '../../order-marketplace/test-utils';
import { MobileButton } from '../MobileButton';

describe('MobileButton Mobile', () => {
  describe('Touch targets', () => {
    it('has touch-friendly classes for sm size', () => {
      const view = renderComponent(<MobileButton label="Test" size="sm" />);
      const btn = view.container.querySelector('button');
      expect(btn).not.toBeNull();
      expect(btn?.className).toContain('min-h-');
      view.unmount();
    });

    it('has touch-friendly classes for md size', () => {
      const view = renderComponent(<MobileButton label="Test" size="md" />);
      const btn = view.container.querySelector('button');
      expect(btn).not.toBeNull();
      expect(btn?.className).toContain('min-h-');
      view.unmount();
    });

    it('has touch-friendly classes for lg size', () => {
      const view = renderComponent(<MobileButton label="Test" size="lg" />);
      const btn = view.container.querySelector('button');
      expect(btn).not.toBeNull();
      expect(btn?.className).toContain('min-h-');
      view.unmount();
    });
  });

  describe('Responsive rendering', () => {
    it('renders correctly at 360px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 360, writable: true });
      const view = renderComponent(<MobileButton label="Test" size="md" />);
      const btn = view.container.querySelector('button');
      expect(btn).not.toBeNull();
      expect(btn?.className).toContain('rounded-2xl');
      view.unmount();
    });

    it('renders correctly at 390px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 390, writable: true });
      const view = renderComponent(<MobileButton label="Test" size="md" />);
      const btn = view.container.querySelector('button');
      expect(btn).not.toBeNull();
      view.unmount();
    });

    it('renders correctly at 430px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 430, writable: true });
      const view = renderComponent(<MobileButton label="Test" size="md" />);
      const btn = view.container.querySelector('button');
      expect(btn).not.toBeNull();
      view.unmount();
    });
  });

  describe('All variants render', () => {
    const variants = ['primary', 'secondary', 'danger', 'ghost', 'success', 'warning'] as const;
    variants.forEach((variant) => {
      it(`renders ${variant} variant correctly`, () => {
        const view = renderComponent(<MobileButton label="Test" variant={variant} />);
        const btn = view.container.querySelector('button');
        expect(btn).not.toBeNull();
        view.unmount();
      });
    });
  });

  describe('Click behavior', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      const view = renderComponent(<MobileButton label="Test" onClick={onClick} />);
      const btn = buttonByText(view.container, /Test/)!;
      view.click(btn);
      expect(onClick).toHaveBeenCalledTimes(1);
      view.unmount();
    });

    it('does not call onClick when disabled', () => {
      const onClick = vi.fn();
      const view = renderComponent(<MobileButton label="Test" onClick={onClick} disabled />);
      const btn = view.container.querySelector('button');
      expect(btn?.disabled).toBe(true);
      view.unmount();
    });
  });

  describe('Loading state', () => {
    it('shows spinner when loading', () => {
      const view = renderComponent(<MobileButton label="Test" loading />);
      const spinner = view.container.querySelector('.animate-spin');
      expect(spinner).not.toBeNull();
      view.unmount();
    });

    it('disables button when loading', () => {
      const view = renderComponent(<MobileButton label="Test" loading />);
      const btn = view.container.querySelector('button');
      expect(btn?.disabled).toBe(true);
      view.unmount();
    });
  });

  describe('Full width', () => {
    it('renders full width by default', () => {
      const view = renderComponent(<MobileButton label="Test" />);
      const btn = view.container.querySelector('button');
      expect(btn?.className).toContain('w-full');
      view.unmount();
    });

    it('renders not full width when fullWidth=false', () => {
      const view = renderComponent(<MobileButton label="Test" fullWidth={false} />);
      const btn = view.container.querySelector('button');
      expect(btn?.className).not.toContain('w-full');
      view.unmount();
    });
  });
});
