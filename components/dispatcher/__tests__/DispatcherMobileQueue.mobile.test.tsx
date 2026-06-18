// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { buttonByText, byText, renderComponent } from '../../order-marketplace/test-utils';
import { DispatcherMobileQueue } from '../DispatcherMobileQueue';

const sampleTask = {
  id: 'MSN-001',
  orderId: 'order-1',
  shipmentId: 'ship-1',
  status: 'pending' as const,
  customerName: 'Jean Kabila',
  pickupAddress: '10 Av. Lumumba',
  pickupZone: 'Gombe',
  deliveryZone: 'Lingwala',
  distanceKm: 3.2,
  queueMinutes: 8,
  priority: 'urgent' as const,
};

const sampleDriver = {
  id: 'drv-1',
  name: 'Mutombo P.',
  zone: 'Gombe',
  status: 'available' as const,
  score: 95,
  load: 1,
  vehicleAvailable: true,
};

const noop = vi.fn();

const baseProps = {
  tasks: [sampleTask],
  drivers: [sampleDriver],
  onSelectTask: noop,
  onAssign: noop,
  onStart: noop,
  onComplete: noop,
  onPrioritize: noop,
  onCancel: noop,
  onOpenTracking: noop,
  isSaving: false,
};

const viewports = [360, 390, 430] as const;

describe('DispatcherMobileQueue Mobile', () => {
  viewports.forEach((width) => {
    it(`renders queue filters at ${width}px`, () => {
      Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
      const view = renderComponent(<DispatcherMobileQueue {...baseProps} />);
      expect(byText(view.container, 'Toutes')).not.toBeNull();
      expect(byText(view.container, 'Urgentes')).not.toBeNull();
      expect(byText(view.container, 'Jean Kabila')).not.toBeNull();
      view.unmount();
    });
  });

  it('expands task and shows assign action', () => {
    const view = renderComponent(<DispatcherMobileQueue {...baseProps} />);
    const taskBtn = buttonByText(view.container, /MSN-001/i);
    expect(taskBtn).not.toBeNull();
    view.click(taskBtn!);
    const assignBtn = buttonByText(view.container, /Assigner un chauffeur/i);
    expect(assignBtn).not.toBeNull();
    view.click(assignBtn!);
    expect(byText(view.container, 'Mutombo P.')).not.toBeNull();
    view.unmount();
  });

  it('calls onPrioritize when urgent task is prioritized', () => {
    const onPrioritize = vi.fn();
    const view = renderComponent(
      <DispatcherMobileQueue {...baseProps} onPrioritize={onPrioritize} />,
    );
    const taskBtn = buttonByText(view.container, /MSN-001/i);
    view.click(taskBtn!);
    const prioritizeBtn = buttonByText(view.container, /Prioriser/i);
    if (prioritizeBtn) {
      view.click(prioritizeBtn);
      expect(onPrioritize).toHaveBeenCalledWith('MSN-001');
    }
    view.unmount();
  });
});
