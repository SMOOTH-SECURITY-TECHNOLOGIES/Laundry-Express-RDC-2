import { realApi, type LogisticsDriver, type LogisticsTask } from './real-api';
import type { DispatchTask, Driver, LogisticsStatus, MaintenanceEvent, TrackingPoint, Trip, Vehicle } from '../components/logistics/logistics-types';

export type DataMode = 'backend' | 'degraded';

export interface LogisticsDataResult<T> {
  data: T;
  mode: DataMode;
  reason?: string;
}

const mapStatus = (status?: string | null): LogisticsStatus => {
  switch (status) {
    case 'driver_assigned':
    case 'accepted':
    case 'claimed':
      return 'assigned';
    case 'in_progress':
      return 'in_transit';
    case 'completed':
      return 'delivered';
    case 'failed':
      return 'failed';
    case 'cancelled':
    case 'expired':
      return 'cancelled';
    case 'open_market':
    case 'pending':
    default:
      return 'pending';
  }
};

const driverStatus = (driver: LogisticsDriver): Driver['status'] => {
  if (driver.status === 'suspended') return 'suspended';
  if (driver.status === 'inactive') return 'offline';
  return driver.is_available ? 'available' : 'busy';
};

export const mapLogisticsDriver = (driver: LogisticsDriver): Driver => ({
  id: driver.id,
  name: driver.user_name || driver.user_email || `Driver ${driver.id.slice(0, 6)}`,
  phone: driver.user_phone || '',
  status: driverStatus(driver),
  zone: 'Kinshasa',
  vehicleId: driver.license_number ? `vehicle-${driver.license_number}` : undefined,
});

export const mapLogisticsTask = (task: LogisticsTask, drivers: Driver[] = []): DispatchTask => {
  const assignedDriver = task.driver_id ? drivers.find((driver) => driver.id === task.driver_id) : undefined;
  const createdAt = task.created_at ? new Date(task.created_at).getTime() : Date.now();
  const queueMinutes = Number.isFinite(createdAt) ? Math.max(0, Math.round((Date.now() - createdAt) / 60000)) : 0;

  return {
    id: task.order_number || task.id,
    orderId: task.order_id,
    shipmentId: task.id,
    status: mapStatus(task.status),
    customerName: task.customer_name || task.pickup_contact_name || 'Client Laundry',
    pickupAddress: task.pickup_address_line || task.pickup_address_label || 'Adresse pickup',
    pickupZone: task.pickup_commune || 'Kinshasa',
    deliveryZone: task.delivery_commune || task.dropoff_location_type || 'Kinshasa',
    distanceKm: 2.4,
    queueMinutes,
    priority: queueMinutes >= 20 ? 'urgent' : queueMinutes >= 10 ? 'high' : 'normal',
    driverId: assignedDriver?.id ?? task.driver_id ?? undefined,
    driverName: assignedDriver?.name,
    vehicleId: assignedDriver?.vehicleId,
    currentDriverLoad: assignedDriver ? 1 : undefined,
  };
};

export const taskToTrip = (task: DispatchTask): Trip => ({
  id: task.shipmentId,
  taskId: task.id,
  status: task.status,
  origin: task.pickupZone,
  destination: task.deliveryZone,
  customerName: task.customerName,
  driverName: task.driverName,
  vehiclePlate: task.vehicleId,
  estimatedDurationMinutes: Math.max(18, Math.round(task.distanceKm * 9)),
  etaMinutes: Math.max(8, Math.round(task.distanceKm * 6)),
  distanceKm: task.distanceKm,
});

const fallbackResult = <T>(fallback: T, reason: string): LogisticsDataResult<T> => ({
  data: fallback,
  mode: 'degraded',
  reason,
});

export const getDispatchTasks = async (fallback: DispatchTask[]): Promise<LogisticsDataResult<DispatchTask[]>> => {
  try {
    const [taskResponse, driverResponse] = await Promise.all([
      realApi.getLogisticsTasks({ page: 1, page_size: 100 }),
      realApi.getLogisticsDrivers({ page: 1, page_size: 100 }),
    ]);
    const drivers = driverResponse.drivers.map(mapLogisticsDriver);
    const tasks = taskResponse.tasks.map((task) => mapLogisticsTask(task, drivers));
    return tasks.length > 0 ? { data: tasks, mode: 'backend' } : fallbackResult(fallback, 'backend tasks empty');
  } catch (error) {
    return fallbackResult(fallback, error instanceof Error ? error.message : 'backend tasks unavailable');
  }
};

export const getVehicles = async (fallback: Vehicle[]): Promise<LogisticsDataResult<Vehicle[]>> => {
  try {
    const response = await realApi.getVehicles();
    return response.vehicles.length > 0 ? { data: response.vehicles, mode: 'backend' } : fallbackResult(fallback, 'backend vehicles empty');
  } catch (error) {
    return fallbackResult(fallback, error instanceof Error ? error.message : 'backend vehicles unavailable');
  }
};

export const getTrips = async (fallback: Trip[]): Promise<LogisticsDataResult<Trip[]>> => {
  try {
    const response = await realApi.getTrips();
    return response.trips.length > 0 ? { data: response.trips, mode: 'backend' } : fallbackResult(fallback, 'backend trips empty');
  } catch {
    const taskResult = await getDispatchTasks([]);
    const trips = taskResult.data.map(taskToTrip);
    return trips.length > 0 ? { data: trips, mode: taskResult.mode, reason: taskResult.reason } : fallbackResult(fallback, 'backend trips unavailable');
  }
};

export const getTrackingPoints = async (fallback: TrackingPoint[]): Promise<LogisticsDataResult<TrackingPoint[]>> => {
  try {
    const response = await realApi.getTrackingPoints();
    return response.tracking_points.length > 0
      ? { data: response.tracking_points, mode: 'backend' }
      : fallbackResult(fallback, 'backend tracking empty');
  } catch (error) {
    return fallbackResult(fallback, error instanceof Error ? error.message : 'backend tracking unavailable');
  }
};

export const getMaintenanceEvents = async (fallback: MaintenanceEvent[]): Promise<LogisticsDataResult<MaintenanceEvent[]>> => {
  try {
    const response = await realApi.getMaintenanceEvents();
    return response.maintenance_events.length > 0
      ? { data: response.maintenance_events, mode: 'backend' }
      : fallbackResult(fallback, 'backend maintenance empty');
  } catch (error) {
    return fallbackResult(fallback, error instanceof Error ? error.message : 'backend maintenance unavailable');
  }
};
