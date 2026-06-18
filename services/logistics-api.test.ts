import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getDispatchTasks,
  getLogisticsDrivers,
  getMissionRows,
  getShipments,
  mapLogisticsDriver,
  mapLogisticsTask,
} from './logistics-api';
import { realApi, type LogisticsDriver, type LogisticsTask } from './real-api';

vi.mock('./real-api', () => ({
  realApi: {
    getLogisticsTasks: vi.fn(),
    getLogisticsDrivers: vi.fn(),
    getVehicles: vi.fn(),
    getTrips: vi.fn(),
    getTrackingPoints: vi.fn(),
    getMaintenanceEvents: vi.fn(),
  },
}));

const backendDriver: LogisticsDriver = {
  id: 'drv-backend-1',
  user_id: 'user-1',
  user_name: 'Backend Driver',
  user_email: 'driver@laundry.test',
  user_phone: '+243810000001',
  vehicle_type: 'moto',
  license_number: 'KIN-001-MT',
  status: 'active',
  is_available: true,
  rating_avg: 4.8,
  rating_count: 12,
  created_at: '2026-06-16T10:00:00.000Z',
  updated_at: '2026-06-16T10:00:00.000Z',
};

const backendTask: LogisticsTask = {
  id: 'task-backend-1',
  order_id: 'order-1',
  order_number: 'LX-9001',
  driver_id: 'drv-backend-1',
  task_type: 'pickup',
  status: 'driver_assigned',
  customer_name: 'Client Backend',
  pickup_address_line: 'Av. Backend 1',
  pickup_commune: 'Gombe',
  delivery_address_line: 'Rue API 2',
  delivery_commune: 'Lingwala',
  created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  updated_at: '2026-06-16T10:05:00.000Z',
};

describe('logistics-api contract mappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps backend driver and task payloads to frontend dispatch contracts', () => {
    const driver = mapLogisticsDriver(backendDriver);
    const task = mapLogisticsTask(backendTask, [driver]);

    expect(driver).toMatchObject({
      id: 'drv-backend-1',
      name: 'Backend Driver',
      phone: '+243810000001',
      status: 'available',
      zone: 'Kinshasa',
      vehicleId: 'vehicle-KIN-001-MT',
    });

    expect(task).toMatchObject({
      id: 'LX-9001',
      orderId: 'order-1',
      shipmentId: 'task-backend-1',
      status: 'assigned',
      customerName: 'Client Backend',
      pickupAddress: 'Av. Backend 1',
      pickupZone: 'Gombe',
      deliveryZone: 'Lingwala',
      driverId: 'drv-backend-1',
      driverName: 'Backend Driver',
      vehicleId: 'vehicle-KIN-001-MT',
    });
  });

  it('returns backend mode when dispatch tasks are available', async () => {
    vi.mocked(realApi.getLogisticsTasks).mockResolvedValue({ tasks: [backendTask], total: 1, page: 1, page_size: 100 });
    vi.mocked(realApi.getLogisticsDrivers).mockResolvedValue({ drivers: [backendDriver], total: 1, page: 1, page_size: 100 });

    const result = await getDispatchTasks([]);

    expect(result.mode).toBe('backend');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('LX-9001');
  });

  it('derives mission rows and shipment rows from backend dispatch tasks', async () => {
    vi.mocked(realApi.getLogisticsTasks).mockResolvedValue({ tasks: [backendTask], total: 1, page: 1, page_size: 100 });
    vi.mocked(realApi.getLogisticsDrivers).mockResolvedValue({ drivers: [backendDriver], total: 1, page: 1, page_size: 100 });

    const missionResult = await getMissionRows([], []);
    const shipmentResult = await getShipments([]);

    expect(missionResult.mode).toBe('backend');
    expect(missionResult.data.missions[0]).toMatchObject({
      id: 'LX-9001',
      status: 'Assignée',
      driver: 'Backend Driver',
      commune: 'Gombe',
    });
    expect(shipmentResult.mode).toBe('backend');
    expect(shipmentResult.data[0]).toMatchObject({
      id: 'task-backend-1',
      orderId: 'LX-9001',
      customerName: 'Client Backend',
      status: 'assigned',
    });
  });

  it('maps backend drivers to complete logistics driver profiles', async () => {
    vi.mocked(realApi.getLogisticsDrivers).mockResolvedValue({ drivers: [backendDriver], total: 1, page: 1, page_size: 100 });

    const result = await getLogisticsDrivers([]);

    expect(result.mode).toBe('backend');
    expect(result.data[0]).toMatchObject({
      id: 'drv-backend-1',
      name: 'Backend Driver',
      phone: '+243810000001',
      vehicle: 'moto',
      vehiclePlate: 'KIN-001-MT',
      status: 'Disponible',
      email: 'driver@laundry.test',
    });
  });

  it('returns degraded mode with fallback when backend dispatch is unavailable', async () => {
    vi.mocked(realApi.getLogisticsTasks).mockRejectedValue(new Error('network down'));
    vi.mocked(realApi.getLogisticsDrivers).mockResolvedValue({ drivers: [], total: 0, page: 1, page_size: 100 });

    const fallback = [{
      id: 'MSN-FALLBACK',
      orderId: 'order-fallback',
      shipmentId: 'shipment-fallback',
      status: 'pending' as const,
      customerName: 'Fallback Client',
      pickupAddress: 'Fallback address',
      pickupZone: 'Kinshasa',
      deliveryZone: 'Gombe',
      distanceKm: 1,
      queueMinutes: 0,
      priority: 'normal' as const,
    }];
    const result = await getDispatchTasks(fallback);

    expect(result.mode).toBe('degraded');
    expect(result.reason).toBe('network down');
    expect(result.data).toBe(fallback);
  });
});
