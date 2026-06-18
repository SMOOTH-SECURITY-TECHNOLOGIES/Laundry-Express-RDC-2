// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { buttonByText, byText, renderComponent } from '../../order-marketplace/test-utils';
import { ClientMobileDashboard } from '../ClientMobileDashboard';

const sampleOrder = {
  id: 'order-1',
  orderRef: 'LX-2024',
  status: 'DELIVERY' as const,
  statusLabel: 'En livraison',
  partnerName: 'Pressing Gombe',
  partnerPhone: '+243812345001',
  driverName: 'Kabongo M.',
  driverPhone: '+243812345002',
  driverInitial: 'K',
  pickupAddress: 'Gombe, Kinshasa',
  deliveryAddress: 'Lingwala, Kinshasa',
  articles: [{ name: 'Chemise', quantity: 2, price: 3 }],
  totalPrice: '8.00 $',
  eta: '25 min',
  estimatedDelivery: "Aujourd'hui avant 18h00",
  createdAt: '18 juin, 10:00',
};

const baseProps = {
  order: sampleOrder,
  onCallPartner: vi.fn(),
  onCallDriver: vi.fn(),
  onChat: vi.fn(),
  onNewOrder: vi.fn(),
  onShareTracking: vi.fn(),
  onContactSupport: vi.fn(),
  hasRated: false,
};

const viewports = [360, 390, 430] as const;

describe('ClientMobileDashboard Mobile', () => {
  viewports.forEach((width) => {
    it(`renders order tracking at ${width}px`, () => {
      Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
      const view = renderComponent(<ClientMobileDashboard {...baseProps} />);
      expect(byText(view.container, 'LX-2024')).not.toBeNull();
      expect(byText(view.container, 'Pressing Gombe')).not.toBeNull();
      expect(byText(view.container, 'Kabongo M.')).not.toBeNull();
      view.unmount();
    });
  });

  it('shows support contact action', () => {
    const view = renderComponent(<ClientMobileDashboard {...baseProps} />);
    expect(buttonByText(view.container, /Support/i)).not.toBeNull();
    view.unmount();
  });

  it('shows delivery timeline steps', () => {
    const view = renderComponent(<ClientMobileDashboard {...baseProps} />);
    expect(byText(view.container, 'Ramassage')).not.toBeNull();
    expect(byText(view.container, 'Livraison')).not.toBeNull();
    view.unmount();
  });
});
