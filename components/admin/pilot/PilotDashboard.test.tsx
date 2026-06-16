// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderComponent, byText } from '../campaigns/test-utils';
import { PilotDashboard } from './PilotDashboard';
import { buildPilotDashboardSummary } from '../../../lib/admin/pilot-metrics';
import { OrderStatus, type Order, type User } from '../../../types';

const user = (id: string): User => ({
  id,
  name: id,
  email: `${id}@example.com`,
  phone: '0810000000',
  role: 'customer',
  pickupAddress: { commune: 'Gombe', avenue: 'Test', numero: '1' },
  loyaltyPoints: 0,
  referralCode: id,
  createdAt: '2026-06-01T08:00:00Z',
  is2FAEnabled: false,
  notificationPreferences: { newOrder: true, orderStatusChange: true, newChatMessage: true, promotions: true, general: true },
  isEmailValid: true,
});

const order = (id: string, userId: string, status: OrderStatus): Order => ({
  id,
  userId,
  partner: null,
  serviceItems: [],
  clientDetails: { name: userId, phone: '0810000000', pickupAddress: { commune: 'Gombe', avenue: 'Test', numero: '1' } },
  pickupTime: '2026-06-01T09:00:00Z',
  status,
  trackingHistory: [
    { status: OrderStatus.AWAITING_CONFIRMATION, time: '2026-06-01T08:00:00Z' },
    { status: OrderStatus.CONFIRMED, time: '2026-06-01T08:12:00Z' },
    { status: OrderStatus.PICKUP, time: '2026-06-01T08:35:00Z' },
    { status: OrderStatus.READY_FOR_DELIVERY, time: '2026-06-01T11:00:00Z' },
    { status: OrderStatus.COMPLETED, time: '2026-06-01T11:40:00Z' },
  ],
  totalPrice: 40,
  createdAt: '2026-06-01T08:00:00Z',
  paymentStatus: 'paid',
});

describe('PilotDashboard', () => {
  it('renders the pilot freeze policy and the 10 operating KPIs', () => {
    const summary = buildPilotDashboardSummary({
      users: [user('u1'), user('u2')],
      orders: [
        order('o1', 'u1', OrderStatus.COMPLETED),
        order('o2', 'u1', OrderStatus.COMPLETED),
        order('o3', 'u2', OrderStatus.CONFIRMED),
      ],
      now: new Date('2026-06-16T00:00:00Z'),
    });

    const { container, unmount } = renderComponent(<PilotDashboard summary={summary} />);

    expect(byText(container, 'Pilot Dashboard')).not.toBeNull();
    expect(byText(container, 'Features freeze: ON')).not.toBeNull();
    expect(byText(container, 'Instrumentation: OPEN')).not.toBeNull();
    expect(byText(container, 'Taux de completion')).not.toBeNull();
    expect(byText(container, 'GO')).not.toBeNull();
    expect(byText(container, 'WATCH')).not.toBeNull();
    expect(byText(container, 'STOP')).not.toBeNull();
    expect(byText(container, '> 70%')).not.toBeNull();
    expect(byText(container, 'STOP: arreter les ajouts produit et corriger le corridor commande-paiement-livraison. WATCH: auditer les abandons. GO: continuer.')).not.toBeNull();
    expect(byText(container, 'Taux de reachat')).not.toBeNull();
    expect(byText(container, 'Revenu partenaires')).not.toBeNull();
    expect(summary.metrics).toHaveLength(10);
    expect(summary.metrics.every((metric) => metric.decisionState && metric.thresholds && metric.action)).toBe(true);

    unmount();
  });
});
