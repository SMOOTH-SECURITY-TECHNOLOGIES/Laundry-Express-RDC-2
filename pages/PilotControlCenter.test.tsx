// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { byText, renderComponent } from '../components/order-marketplace/test-utils';
import { PilotControlCenter } from './PilotControlCenter';
import { OrderStatus } from '../types';

vi.mock('../config/pilot', () => ({
  pilotConfig: {
    isPilotMode: true,
    paymentModeLabel: 'Mode sandbox — aucun débit réel',
  },
}));

vi.mock('../context/AppContext', () => ({
  useAppContext: () => ({
    users: [{ id: 'u1', role: 'customer', name: 'Client' }],
    orderHistory: [
      {
        id: 'o1',
        userId: 'u1',
        status: OrderStatus.COMPLETED,
        paymentStatus: 'paid',
        totalPrice: 40,
        createdAt: '2026-06-01T08:00:00Z',
        trackingHistory: [{ status: OrderStatus.COMPLETED, time: '2026-06-01T11:00:00Z' }],
        partner: null,
        serviceItems: [],
        clientDetails: {} as any,
        pickupTime: '2026-06-01T09:00:00Z',
      },
    ],
    supportTickets: [],
  }),
}));

describe('PilotControlCenter', () => {
  it('renders admin pilot KPIs and logistics instrumentation', () => {
    const view = renderComponent(<PilotControlCenter />);
    expect(byText(view.container, 'Pilot Dashboard')).toBeTruthy();
    expect(byText(view.container, 'Instrumentation logistique terrain')).toBeTruthy();
    expect(byText(view.container, 'Mode pilote actif')).toBeTruthy();
    view.unmount();
  });
});
