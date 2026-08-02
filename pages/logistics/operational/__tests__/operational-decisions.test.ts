import { describe, expect, it } from 'vitest';
import { buildOperationalDecisions, buildCapacitySummary } from '../operational-decisions';
import type { LogisticsDriver, LogisticsTask, Order } from '../../../../services/real-api';

const driver: LogisticsDriver = {
  id: 'driver-1',
  user_id: 'u1',
  user_name: 'Mukendi',
  user_email: 'mukendi@test.cd',
  user_phone: '+243800000001',
  status: 'active',
  is_available: true,
  rating_avg: 4.8,
  rating_count: 12,
  created_at: '2026-06-18T08:00:00.000Z',
  updated_at: '2026-06-18T08:00:00.000Z',
};

describe('buildOperationalDecisions', () => {
  it('prioritizes failed missions with driver reassignment suggestion', () => {
    const task: LogisticsTask = {
      id: 'task-fail-1',
      order_id: 'order-1',
      order_number: 'LX-9001',
      task_type: 'delivery',
      status: 'failed',
      pickup_commune: 'Gombe',
      created_at: '2026-06-18T07:00:00.000Z',
      updated_at: '2026-06-18T09:00:00.000Z',
    };
    const order: Order = {
      id: 'order-1',
      order_number: 'LX-9001',
      customer_id: 'c1',
      partner_id: 'p1',
      partner_name: 'Pressing Prestige',
      total_amount: 60000,
      amount_paid: 60000,
      payment_status: 'paid',
      status: 'processing',
      created_at: '2026-06-18T07:00:00.000Z',
      updated_at: '2026-06-18T07:00:00.000Z',
    };

    const decisions = buildOperationalDecisions([task], [driver], [order], [], {
      openCount: 0,
      activeCount: 0,
      fieldActivity: [],
    });
    expect(decisions[0]?.priority).toBe('critical');
    expect(decisions[0]?.impact).toContain('premium');
    expect(decisions[0]?.suggestion).toContain('Mukendi');
  });

  it('flags unassigned pending missions after threshold', () => {
    const old = new Date(Date.now() - 25 * 60_000).toISOString();
    const task: LogisticsTask = {
      id: 'task-pending-1',
      order_id: 'order-2',
      order_number: 'LX-9002',
      task_type: 'pickup',
      status: 'pending',
      pickup_commune: 'Limete',
      created_at: old,
      updated_at: old,
    };

    const decisions = buildOperationalDecisions([task], [driver], [], [], {
      openCount: 1,
      activeCount: 0,
      fieldActivity: [],
    });
    expect(decisions.some((d) => d.id.startsWith('unassigned-'))).toBe(true);
    expect(decisions[0]?.suggestion).toContain('Mukendi');
  });

  it('flags low capacity when demand exceeds available drivers', () => {
    const summary = buildCapacitySummary(1, 0, 4, [{ hour: '10h', count: 4 }]);
    expect(summary.sufficient).toBe(false);
    expect(summary.headline).toContain('Capacité faible');
    expect(summary.expectedVolume2h).toBeGreaterThanOrEqual(5);
  });

  it('marks calm network with one driver as sufficient', () => {
    const summary = buildCapacitySummary(1, 0, 0, []);
    expect(summary.sufficient).toBe(true);
    expect(summary.headline).toContain('Capacité suffisante');
  });
});
