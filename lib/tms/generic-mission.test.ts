import { describe, expect, it } from 'vitest';
import {
  logisticsTaskToTmsMission,
  mapLogisticsTaskViaTms,
  tmsMissionToDispatchTask,
} from './generic-mission';
import type { LogisticsTask } from '../../services/real-api';

const sampleTask: LogisticsTask = {
  id: 'task-uuid-1',
  order_id: 'order-1',
  order_number: 'LX-9001',
  task_type: 'pickup',
  status: 'driver_assigned',
  customer_name: 'Marie Kabongo',
  pickup_address_line: '10 Av. Lumumba',
  pickup_commune: 'Gombe',
  delivery_commune: 'Lingwala',
  created_at: new Date(Date.now() - 25 * 60000).toISOString(),
  updated_at: new Date().toISOString(),
  driver_id: 'drv-1',
};

describe('generic-mission TMS adapter', () => {
  it('maps laundry task status to generic TMS status', () => {
    const mission = logisticsTaskToTmsMission(sampleTask, [
      { id: 'drv-1', name: 'Kabongo', phone: '', status: 'available', zone: 'Gombe' },
    ]);
    expect(mission.status).toBe('allocated');
    expect(mission.externalRef).toBe('LX-9001');
    expect(mission.missionType).toBe('pickup');
    expect(mission.priority).toBe('urgent');
  });

  it('round-trips through dispatch task mapping', () => {
    const dispatchTask = mapLogisticsTaskViaTms(sampleTask);
    expect(dispatchTask.id).toBe('LX-9001');
    expect(dispatchTask.shipmentId).toBe('task-uuid-1');
    expect(dispatchTask.missionType).toBe('pickup');
    expect(dispatchTask.status).toBe('assigned');
    expect(dispatchTask.customerName).toBe('Marie Kabongo');
  });

  it('maps TMS executing status to in_transit dispatch status', () => {
    const dispatch = tmsMissionToDispatchTask({
      id: 't1',
      externalRef: 'MSN-1',
      orderId: 'o1',
      missionType: 'delivery',
      status: 'executing',
      priority: 'normal',
      customerName: 'Client',
      pickup: { label: 'A', zone: 'Gombe' },
      delivery: { label: 'B', zone: 'Lingwala' },
      queueMinutes: 5,
      distanceKm: 2,
    });
    expect(dispatch.status).toBe('in_transit');
    expect(dispatch.missionType).toBe('delivery');
  });
});
