// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { buttonByText, byText, renderComponent } from '../../order-marketplace/test-utils';
import { TripDetailsMobile } from '../TripDetailsMobile';

const sampleTrip = {
  id: 'trip-1',
  taskId: 'MSN-042',
  status: 'in_transit' as const,
  origin: 'Gombe',
  destination: 'Lingwala',
  distanceKm: 3.4,
  etaMinutes: 18,
  estimatedDurationMinutes: 32,
  customerName: 'Mama Jeanne',
  driverName: 'Tshimanga A.',
  vehiclePlate: 'KIN-042-MT',
  clientPhone: '+243812345901',
  driverPhone: '+243810002',
  pickupAddress: 'Av. Lumumba 42, Gombe',
  deliveryAddress: 'Avenue Kalembelembe, Lingwala',
  createdAt: '10:02',
  assignedAt: '10:05',
  pickupAt: '10:12',
  inTransitAt: '10:15',
};

const baseProps = {
  trip: sampleTrip,
  onBack: vi.fn(),
  onCallDriver: vi.fn(),
  onCallCustomer: vi.fn(),
  onIncident: vi.fn(),
  onDelay: vi.fn(),
  onUpdateStatus: vi.fn(),
};

const viewports = [360, 390, 430] as const;

describe('TripDetailsMobile Mobile', () => {
  viewports.forEach((width) => {
    it(`renders trip details at ${width}px`, () => {
      Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
      const view = renderComponent(<TripDetailsMobile {...baseProps} />);
      expect(byText(view.container, 'MSN-042')).not.toBeNull();
      expect(byText(view.container, 'Tshimanga A.')).not.toBeNull();
      expect(byText(view.container, 'Mama Jeanne')).not.toBeNull();
      view.unmount();
    });
  });

  it('shows primary status action for in_transit trip', () => {
    const view = renderComponent(<TripDetailsMobile {...baseProps} />);
    expect(buttonByText(view.container, /Terminer mission/i)).not.toBeNull();
    view.unmount();
  });

  it('calls onCallDriver when call button is clicked', () => {
    const onCallDriver = vi.fn();
    const view = renderComponent(<TripDetailsMobile {...baseProps} onCallDriver={onCallDriver} />);
    const callBtn = buttonByText(view.container, /Appeler/i);
    expect(callBtn).not.toBeNull();
    view.click(callBtn!);
    expect(onCallDriver).toHaveBeenCalled();
    view.unmount();
  });
});
