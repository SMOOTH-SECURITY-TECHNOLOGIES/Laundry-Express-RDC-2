export type LogisticsSection =
  | 'dashboard'
  | 'fleet'
  | 'missions'
  | 'drivers'
  | 'dispatch'
  | 'tracking'
  | 'trip-details'
  | 'shipments'
  | 'performance'
  | 'alerts'
  | 'maintenance'
  | 'reports'
  | 'settings'
  | 'pilot';

export const LOGISTICS_SECTIONS: LogisticsSection[] = [
  'dashboard',
  'fleet',
  'missions',
  'drivers',
  'dispatch',
  'tracking',
  'trip-details',
  'shipments',
  'performance',
  'alerts',
  'maintenance',
  'reports',
  'settings',
  'pilot',
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
  type: 'moto' | 'car' | 'van';
  status: LogisticsStatus;
  driverId?: string;
  assignedDriverName?: string;
  zone: string;
  location: string;
  lastKnownLocation?: string;
  mileageKm: number;
  insuranceExpiresAt: string;
  maintenance: {
    status: 'ok' | 'scheduled' | 'in_progress' | 'overdue';
    nextServiceAtKm: number;
    notes?: string;
  };
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  status: 'available' | 'busy' | 'offline' | 'suspended';
  zone: string;
  vehicleId?: string;
}

export interface DispatchTask {
  id: string;
  orderId: string;
  shipmentId: string;
  status: LogisticsStatus;
  customerName: string;
  pickupAddress: string;
  pickupZone: string;
  deliveryZone: string;
  distanceKm: number;
  queueMinutes: number;
  priority: 'normal' | 'high' | 'urgent';
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  currentDriverLoad?: number;
  /** Statut brut backend (open_market, claimed, etc.) */
  taskStatus?: string;
  claimedByCompanyId?: string;
}

export interface Trip {
  id: string;
  taskId: string;
  status: LogisticsStatus;
  origin: string;
  destination: string;
  customerName?: string;
  driverName?: string;
  vehiclePlate?: string;
  estimatedDurationMinutes?: number;
  etaMinutes?: number;
  distanceKm?: number;
}

export interface TripTimelineEvent {
  id: string;
  tripId: string;
  label: 'created' | 'assigned' | 'pickup' | 'in_transit' | 'delivered';
  title: string;
  timestamp: string;
  completed: boolean;
}

export interface Shipment {
  id: string;
  orderId: string;
  customerName: string;
  status: LogisticsStatus;
  pickupZone: string;
  deliveryZone: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  tripId?: string;
  driverName?: string;
  vehiclePlate?: string;
  etaMinutes?: number;
  createdAt?: string;
  updatedAt?: string;
  proofRequired?: boolean;
  incidentCount?: number;
}

export interface TrackingPoint {
  id: string;
  tripId: string;
  kind: 'vehicle' | 'driver' | 'pickup' | 'delivery';
  label: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
  status: LogisticsStatus;
  driverName?: string;
  vehiclePlate?: string;
}

export interface MaintenanceEvent {
  id: string;
  vehicleId: string;
  vehiclePlate?: string;
  title: string;
  type: 'insurance' | 'repair' | 'preventive' | 'inspection';
  status: 'scheduled' | 'in_progress' | 'done' | 'overdue';
  dueDate: string;
  cost: number;
  nextControlAt: string;
  alert?: 'insurance_expired' | 'vehicle_broken' | 'maintenance_overdue';
  vehicleAvailable: boolean;
  costEstimate?: number;
}
