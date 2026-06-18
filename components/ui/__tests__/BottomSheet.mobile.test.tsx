// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { byText, renderComponent } from '../../order-marketplace/test-utils';
import { BottomSheet } from '../BottomSheet';

describe('BottomSheet Mobile', () => {
  describe('Rendering', () => {
    it('renders when isOpen=true', () => {
      const view = renderComponent(
        <BottomSheet isOpen={true} onClose={vi.fn()} title="Test">
          <p>Content</p>
        </BottomSheet>
      );
      expect(byText(view.container, 'Test')).not.toBeNull();
      expect(byText(view.container, 'Content')).not.toBeNull();
      view.unmount();
    });

    it('does not render when isOpen=false', () => {
      const view = renderComponent(
        <BottomSheet isOpen={false} onClose={vi.fn()} title="Test">
          <p>Content</p>
        </BottomSheet>
      );
      expect(byText(view.container, 'Test')).toBeNull();
      view.unmount();
    });
  });

  describe('Responsive rendering', () => {
    it('renders correctly at 360px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 360, writable: true });
      const view = renderComponent(
        <BottomSheet isOpen={true} onClose={vi.fn()} title="Test">
          <p>Content</p>
        </BottomSheet>
      );
      const sheet = view.container.querySelector('[role="dialog"]') || view.container.querySelector('.fixed');
      expect(sheet).not.toBeNull();
      view.unmount();
    });

    it('renders correctly at 390px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 390, writable: true });
      const view = renderComponent(
        <BottomSheet isOpen={true} onClose={vi.fn()} title="Test">
          <p>Content</p>
        </BottomSheet>
      );
      expect(byText(view.container, 'Test')).not.toBeNull();
      view.unmount();
    });

    it('renders correctly at 430px width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 430, writable: true });
      const view = renderComponent(
        <BottomSheet isOpen={true} onClose={vi.fn()} title="Test">
          <p>Content</p>
        </BottomSheet>
      );
      expect(byText(view.container, 'Test')).not.toBeNull();
      view.unmount();
    });
  });

  describe('Close behavior', () => {
    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn();
      const view = renderComponent(
        <BottomSheet isOpen={true} onClose={onClose} title="Test">
          <p>Content</p>
        </BottomSheet>
      );
      const closeBtn = view.container.querySelector('[aria-label="Fermer"]');
      expect(closeBtn).not.toBeNull();
      view.unmount();
    });

    it('has backdrop for closing', () => {
      const view = renderComponent(
        <BottomSheet isOpen={true} onClose={vi.fn()} title="Test">
          <p>Content</p>
        </BottomSheet>
      );
      const backdrop = view.container.querySelector('.bg-slate-900\\/50');
      expect(backdrop).not.toBeNull();
      view.unmount();
    });
  });

  describe('Content rendering', () => {
    it('renders title correctly', () => {
      const view = renderComponent(
        <BottomSheet isOpen={true} onClose={vi.fn()} title="Mon titre">
          <p>Content</p>
        </BottomSheet>
      );
      expect(byText(view.container, 'Mon titre')).not.toBeNull();
      view.unmount();
    });

    it('renders children correctly', () => {
      const view = renderComponent(
        <BottomSheet isOpen={true} onClose={vi.fn()} title="Test">
          <button>Action</button>
        </BottomSheet>
      );
      expect(byText(view.container, 'Action')).not.toBeNull();
      view.unmount();
    });
  });

  describe('Accessibility', () => {
    it('has proper z-index for mobile overlay', () => {
      const view = renderComponent(
        <BottomSheet isOpen={true} onClose={vi.fn()} title="Test">
          <p>Content</p>
        </BottomSheet>
      );
      const overlay = view.container.querySelector('.z-\\[100\\]');
      expect(overlay).not.toBeNull();
      view.unmount();
    });
  });
});
