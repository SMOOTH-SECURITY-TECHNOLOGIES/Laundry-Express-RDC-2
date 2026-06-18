// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { buttonByText, byText, renderComponent } from '../../order-marketplace/test-utils';
import { DispatcherMobileDashboard } from '../DispatcherMobileDashboard';

const sampleMission = {
  id: 'MSN-001',
  orderRef: 'ORD-42',
  status: 'pending',
  statusLabel: 'En attente',
  priority: 'urgent' as const,
  clientName: 'Jean Kabila',
  pickupZone: 'Gombe',
  deliveryZone: 'Lingwala',
  distance: '3.2 km',
  eta: '8 min',
  queueMinutes: 8,
};

const sampleDriver = {
  id: 'drv-1',
  name: 'Mutombo P.',
  zone: 'Gombe',
  status: 'available' as const,
  score: 95,
  load: 1,
};

const noop = vi.fn();

const baseProps = {
  missions: [sampleMission],
  drivers: [sampleDriver],
  stats: { total: 1, urgent: 1, pending: 1, active: 0 },
  onSelectMission: noop,
  onAssignDriver: noop,
  onStartMission: noop,
  onCompleteMission: noop,
  onPrioritize: noop,
  onCancel: noop,
  onRefresh: noop,
  onOpenTracking: noop,
  isSaving: false,
};

const viewports = [360, 390, 430] as const;

describe('DispatcherMobileDashboard Mobile', () => {
  viewports.forEach((width) => {
    it(`renders dispatch tabs at ${width}px`, () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
      const view = renderComponent(<DispatcherMobileDashboard {...baseProps} />);
      expect(byText(view.container, 'Dispatch')).toBeTruthy();
      expect(byText(view.container, 'À assigner')).toBeTruthy();
      expect(byText(view.container, 'En cours')).toBeTruthy();
      expect(byText(view.container, 'Urgences')).toBeTruthy();
      view.unmount();
    });
  });

  it('shows pending mission card', () => {
    const view = renderComponent(<DispatcherMobileDashboard {...baseProps} />);
    expect(byText(view.container, '#ORD-42')).toBeTruthy();
    expect(byText(view.container, 'Jean Kabila')).toBeTruthy();
    view.unmount();
  });

  it('calls onRefresh when refresh button clicked', () => {
    const onRefresh = vi.fn();
    const view = renderComponent(<DispatcherMobileDashboard {...baseProps} onRefresh={onRefresh} />);
    const headerButtons = view.container.querySelectorAll('header button');
    const refreshBtn = headerButtons[headerButtons.length - 1];
    view.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalled();
    view.unmount();
  });

  it('shows assign action for pending missions', () => {
    const view = renderComponent(<DispatcherMobileDashboard {...baseProps} />);
    expect(buttonByText(view.container, /Assigner/)).toBeTruthy();
    view.unmount();
  });

  it('calls onOpenTracking from active mission card', () => {
    const onOpenTracking = vi.fn();
    const view = renderComponent(
      <DispatcherMobileDashboard
        {...baseProps}
        missions={[{ ...sampleMission, status: 'in_progress', statusLabel: 'En cours' }]}
        stats={{ total: 1, urgent: 0, pending: 0, active: 1 }}
        onOpenTracking={onOpenTracking}
      />,
    );
    view.click(buttonByText(view.container, /^En cours/)!);
    const trackBtn = view.container.querySelector('[aria-label="Ouvrir tracking"]');
    expect(trackBtn).toBeTruthy();
    view.click(trackBtn!);
    expect(onOpenTracking).toHaveBeenCalledWith('MSN-001');
    view.unmount();
  });
});
