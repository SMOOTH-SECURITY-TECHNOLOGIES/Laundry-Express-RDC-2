export type LogisticsSection =
  | 'dashboard'
  | 'fleet'
  | 'missions'
  | 'drivers'
  | 'dispatch'
  | 'tracking'
  | 'shipments'
  | 'performance'
  | 'alerts'
  | 'maintenance'
  | 'reports'
  | 'settings';

export const LOGISTICS_SECTIONS: LogisticsSection[] = [
  'dashboard',
  'fleet',
  'missions',
  'drivers',
  'dispatch',
  'tracking',
  'shipments',
  'performance',
  'alerts',
  'maintenance',
  'reports',
  'settings',
];

export const isLogisticsSection = (value: string): value is LogisticsSection =>
  LOGISTICS_SECTIONS.includes(value as LogisticsSection);

export type LogisticsStatus =
  | 'pending'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'delayed'
  | 'failed'
  | 'cancelled';

export interface Vehicle {
  id: string;
  plate: string;
  type: 'moto' | 'car' | 'van' | 'truck';
  status: LogisticsStatus;
  driverId?: string;
  zone: string;
  lastKnownLocation?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: 'available' | 'busy' | 'offline' | 'suspended';
  zone: string;
  vehicleId?: string;
}

export interface DispatchTask {
  id: string;
  orderId: string;
  shipmentId: string;
  status: LogisticsStatus;
  pickupZone: string;
  deliveryZone: string;
  driverId?: string;
  vehicleId?: string;
}

export interface Trip {
  id: string;
  taskId: string;
  status: LogisticsStatus;
  origin: string;
  destination: string;
  etaMinutes?: number;
  distanceKm?: number;
}

export interface Shipment {
  id: string;
  orderId: string;
  customerName: string;
  status: LogisticsStatus;
  pickupZone: string;
  deliveryZone: string;
}

export interface TrackingPoint {
  id: string;
  tripId: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
  status: LogisticsStatus;
}

export interface MaintenanceEvent {
  id: string;
  vehicleId: string;
  title: string;
  status: 'scheduled' | 'in_progress' | 'done' | 'overdue';
  dueDate: string;
  costEstimate?: number;
}
