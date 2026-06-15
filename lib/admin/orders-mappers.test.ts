import { describe, expect, it } from 'vitest';
import type { Order } from '../../services/real-api';
import {
  mapOrdersToKpis,
  mapOrdersToPipeline,
  mapOrdersToLiveOrders,
} from './orders-mappers';

const sampleOrders: Order[] = [
  {
    id: '1',
    order_number: 'ORD-1001',
    customer_id: 'c1',
    customer_name: 'Marie Dupont',
    customer_phone: '+243 812 000 001',
    partner_id: 'p1',
    partner_name: 'Prestige Pressing',
    total_amount: 15000,
    amount_paid: 15000,
    payment_status: 'paid',
    status: 'pickup_in_progress',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pickup_commune: 'Gombe',
  },
  {
    id: '2',
    order_number: 'ORD-1002',
    customer_id: 'c2',
    customer_name: 'Jean Kabila',
    customer_phone: '+243 812 000 002',
    partner_id: 'p2',
    partner_name: 'Clean Master',
    total_amount: 22000,
    amount_paid: 0,
    payment_status: 'pending',
    status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pickup_commune: 'Limete',
  },
];

describe('orders-mappers', () => {
  it('maps KPI totals from orders', () => {
    const kpis = mapOrdersToKpis(sampleOrders, null);
    expect(kpis.total).toBe(2);
    expect(kpis.inPickup).toBe(1);
    expect(kpis.revenueToday).toBeGreaterThan(0);
  });

  it('maps pipeline stages', () => {
    const pipeline = mapOrdersToPipeline(sampleOrders);
    expect(pipeline.length).toBeGreaterThan(0);
    expect(pipeline.some((step) => step.count > 0)).toBe(true);
  });

  it('maps live orders with display labels', () => {
    const live = mapOrdersToLiveOrders(sampleOrders, [], []);
    expect(live.length).toBeGreaterThan(0);
    expect(live[0].clientName).toBe('Marie Dupont');
    expect(live[0].status).toBe('Collecte en cours');
  });
});
