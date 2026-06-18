// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { buttonByText, byText, renderComponent } from '../../order-marketplace/test-utils';
import { MobileButton } from '../MobileButton';

describe('MobileButton', () => {
  it('renders with label', () => {
    const view = renderComponent(<MobileButton label="Accepter" />);
    expect(byText(view.container, 'Accepter')).not.toBeNull();
    view.unmount();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const view = renderComponent(<MobileButton label="Test" onClick={onClick} />);
    const btn = buttonByText(view.container, /Test/)!;
    view.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('renders with primary variant classes', () => {
    const view = renderComponent(<MobileButton label="Primary" variant="primary" />);
    const btn = view.container.querySelector('button');
    expect(btn?.className).toContain('bg-brand-blue');
    view.unmount();
  });

  it('renders with danger variant classes', () => {
    const view = renderComponent(<MobileButton label="Danger" variant="danger" />);
    const btn = view.container.querySelector('button');
    expect(btn?.className).toContain('bg-red-500');
    view.unmount();
  });

  it('renders with success variant classes', () => {
    const view = renderComponent(<MobileButton label="Success" variant="success" />);
    const btn = view.container.querySelector('button');
    expect(btn?.className).toContain('bg-green-500');
    view.unmount();
  });

  it('renders disabled state', () => {
    const view = renderComponent(<MobileButton label="Disabled" disabled />);
    const btn = view.container.querySelector('button');
    expect(btn?.disabled).toBe(true);
    view.unmount();
  });

  it('renders loading state', () => {
    const view = renderComponent(<MobileButton label="Loading" loading />);
    const btn = view.container.querySelector('button');
    expect(btn?.disabled).toBe(true);
    const spinner = view.container.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
    view.unmount();
  });

  it('renders with sm size classes', () => {
    const view = renderComponent(<MobileButton label="Small" size="sm" />);
    const btn = view.container.querySelector('button');
    expect(btn?.className).toContain('min-h-[40px]');
    view.unmount();
  });

  it('renders with lg size classes', () => {
    const view = renderComponent(<MobileButton label="Large" size="lg" />);
    const btn = view.container.querySelector('button');
    expect(btn?.className).toContain('min-h-[52px]');
    view.unmount();
  });

  it('renders full width by default', () => {
    const view = renderComponent(<MobileButton label="Full" />);
    const btn = view.container.querySelector('button');
    expect(btn?.className).toContain('w-full');
    view.unmount();
  });
});
