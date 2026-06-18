// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { byText, renderComponent } from '../../order-marketplace/test-utils';
import { TrackingMobile } from '../TrackingMobile';

const sampleTrip = {
  id: 'trip-1',
  taskId: 'MSN-004',
  status: 'in_transit' as const,
  statusLabel: 'En cours',
  trackingStatus: 'busy' as const,
  origin: 'Gombe',
  destination: 'Lingwala',
  etaMinutes: 18,
  distanceKm: 3.4,
  customerName: 'Mama Jeanne',
  driverName: 'Tshimanga A.',
  vehiclePlate: 'KIN-042-MT',
};

const baseProps = {
  trips: [sampleTrip],
  onSelectTrip: vi.fn(),
  onRefresh: vi.fn(),
  lastSyncAt: '10:19',
};

const viewports = [360, 390, 430] as const;

describe('TrackingMobile Mobile', () => {
  viewports.forEach((width) => {
    it(`renders live tracking list at ${width}px`, () => {
      Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
      const view = renderComponent(<TrackingMobile {...baseProps} />);
      expect(byText(view.container, 'Live Tracking')).toBeTruthy();
      expect(byText(view.container, 'MSN-004')).toBeTruthy();
      expect(byText(view.container, 'Mama Jeanne')).toBeTruthy();
      view.unmount();
    });
  });

  it('shows tracking metrics', () => {
    const view = renderComponent(<TrackingMobile {...baseProps} />);
    expect(byText(view.container, 'Suivies')).toBeTruthy();
    expect(byText(view.container, 'Retards')).toBeTruthy();
    expect(byText(view.container, 'ETA moyen')).toBeTruthy();
    view.unmount();
  });

  it('calls onSelectTrip when a trip is selected', () => {
    const onSelectTrip = vi.fn();
    const view = renderComponent(<TrackingMobile {...baseProps} onSelectTrip={onSelectTrip} />);
    const tripBtn = Array.from(view.container.querySelectorAll('button')).find(
      (btn) => btn.textContent?.includes('MSN-004'),
    );
    expect(tripBtn).toBeTruthy();
    view.click(tripBtn!);
    expect(onSelectTrip).toHaveBeenCalledWith('trip-1');
    view.unmount();
  });
});
