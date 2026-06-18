import type { DispatchTask, Driver } from '../../components/logistics/logistics-types';
import type { LogisticsTask } from '../../services/real-api';

/** Statuts génériques TMS (indépendants du métier blanchisserie). */
export type TmsMissionStatus =
  | 'created'
  | 'allocated'
  | 'executing'
  | 'completed'
  | 'cancelled'
  | 'exception';

export interface TmsLocation {
  label: string;
  zone: string;
}

export interface TmsMission {
  id: string;
  externalRef: string;
  orderId: string;
  status: TmsMissionStatus;
  priority: 'normal' | 'high' | 'urgent';
  customerName: string;
  pickup: TmsLocation;
  delivery: TmsLocation;
  assigneeId?: string;
  assigneeName?: string;
  assigneeVehicleId?: string;
  queueMinutes: number;
  distanceKm: number;
}

const laundryStatusToTms = (status?: string | null): TmsMissionStatus => {
  switch (status) {
    case 'driver_assigned':
    case 'accepted':
    case 'claimed':
      return 'allocated';
    case 'in_progress':
      return 'executing';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'exception';
    case 'cancelled':
    case 'expired':
      return 'cancelled';
    default:
      return 'created';
  }
};

const tmsStatusToDispatch = (status: TmsMissionStatus): DispatchTask['status'] => {
  switch (status) {
    case 'allocated':
      return 'assigned';
    case 'executing':
      return 'in_transit';
    case 'completed':
      return 'delivered';
    case 'exception':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
};

export function logisticsTaskToTmsMission(task: LogisticsTask, drivers: Driver[] = []): TmsMission {
  const assignedDriver = task.driver_id ? drivers.find((driver) => driver.id === task.driver_id) : undefined;
  const createdAt = task.created_at ? new Date(task.created_at).getTime() : Date.now();
  const queueMinutes = Number.isFinite(createdAt) ? Math.max(0, Math.round((Date.now() - createdAt) / 60000)) : 0;

  return {
    id: task.id,
    externalRef: task.order_number || task.id,
    orderId: task.order_id,
    status: laundryStatusToTms(task.status),
    priority: queueMinutes >= 20 ? 'urgent' : queueMinutes >= 10 ? 'high' : 'normal',
    customerName: task.customer_name || task.pickup_contact_name || 'Client',
    pickup: {
      label: task.pickup_address_line || task.pickup_address_label || 'Pickup',
      zone: task.pickup_commune || 'Kinshasa',
    },
    delivery: {
      label: task.delivery_address_line || task.delivery_address_label || 'Delivery',
      zone: task.delivery_commune || task.dropoff_location_type || 'Kinshasa',
    },
    assigneeId: assignedDriver?.id ?? task.driver_id ?? undefined,
    assigneeName: assignedDriver?.name,
    assigneeVehicleId: assignedDriver?.vehicleId,
    queueMinutes,
    distanceKm: 2.4,
  };
}

export function tmsMissionToDispatchTask(mission: TmsMission): DispatchTask {
  return {
    id: mission.externalRef,
    orderId: mission.orderId,
    shipmentId: mission.id,
    status: tmsStatusToDispatch(mission.status),
    customerName: mission.customerName,
    pickupAddress: mission.pickup.label,
    pickupZone: mission.pickup.zone,
    deliveryZone: mission.delivery.zone,
    distanceKm: mission.distanceKm,
    queueMinutes: mission.queueMinutes,
    priority: mission.priority,
    driverId: mission.assigneeId,
    driverName: mission.assigneeName,
    vehicleId: mission.assigneeVehicleId,
    currentDriverLoad: mission.assigneeId ? 1 : undefined,
  };
}

export function mapLogisticsTaskViaTms(task: LogisticsTask, drivers: Driver[] = []): DispatchTask {
  const dispatchTask = tmsMissionToDispatchTask(logisticsTaskToTmsMission(task, drivers));
  return {
    ...dispatchTask,
    taskStatus: task.status,
    claimedByCompanyId: task.claimed_by_company_id || undefined,
  };
}
