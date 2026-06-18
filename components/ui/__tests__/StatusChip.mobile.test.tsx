// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderComponent } from '../../order-marketplace/test-utils';
import { StatusChip } from '../StatusChip';

describe('StatusChip Mobile', () => {
  describe('Responsive rendering', () => {
    it('renders correctly at 360px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 360, writable: true });
      const view = renderComponent(<StatusChip label="Test" size="sm" />);
      const chip = view.container.querySelector('[role="status"]');
      expect(chip).not.toBeNull();
      expect(chip?.className).toContain('rounded-full');
      view.unmount();
    });

    it('renders correctly at 390px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 390, writable: true });
      const view = renderComponent(<StatusChip label="Test" size="sm" />);
      const chip = view.container.querySelector('[role="status"]');
      expect(chip).not.toBeNull();
      view.unmount();
    });

    it('renders correctly at 430px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 430, writable: true });
      const view = renderComponent(<StatusChip label="Test" size="sm" />);
      const chip = view.container.querySelector('[role="status"]');
      expect(chip).not.toBeNull();
      view.unmount();
    });
  });

  describe('Touch targets', () => {
    it('has touch-friendly classes', () => {
      const view = renderComponent(<StatusChip label="Test" size="md" />);
      const chip = view.container.querySelector('[role="status"]');
      expect(chip).not.toBeNull();
      // Check for padding classes that provide touch targets
      expect(chip?.className).toContain('px-');
      expect(chip?.className).toContain('py-');
      view.unmount();
    });
  });

  describe('All tones render', () => {
    const tones = ['success', 'info', 'warning', 'danger', 'neutral'] as const;
    tones.forEach((tone) => {
      it(`renders ${tone} tone correctly`, () => {
        const view = renderComponent(<StatusChip label="Test" tone={tone} />);
        const chip = view.container.querySelector('[role="status"]');
        expect(chip).not.toBeNull();
        view.unmount();
      });
    });
  });

  describe('All sizes render', () => {
    const sizes = ['xs', 'sm', 'md'] as const;
    sizes.forEach((size) => {
      it(`renders ${size} size correctly`, () => {
        const view = renderComponent(<StatusChip label="Test" size={size} />);
        const chip = view.container.querySelector('[role="status"]');
        expect(chip).not.toBeNull();
        view.unmount();
      });
    });
  });

  describe('All variants render', () => {
    const variants = ['filled', 'soft', 'outline'] as const;
    variants.forEach((variant) => {
      it(`renders ${variant} variant correctly`, () => {
        const view = renderComponent(<StatusChip label="Test" variant={variant} />);
        const chip = view.container.querySelector('[role="status"]');
        expect(chip).not.toBeNull();
        view.unmount();
      });
    });
  });

  describe('Pulse animation', () => {
    it('renders pulse dot when pulse=true', () => {
      const view = renderComponent(<StatusChip label="Live" pulse />);
      const dot = view.container.querySelector('.animate-pulse');
      expect(dot).not.toBeNull();
      view.unmount();
    });

    it('does not render pulse dot when pulse=false', () => {
      const view = renderComponent(<StatusChip label="Test" pulse={false} />);
      const dot = view.container.querySelector('.animate-pulse');
      expect(dot).toBeNull();
      view.unmount();
    });
  });
});
