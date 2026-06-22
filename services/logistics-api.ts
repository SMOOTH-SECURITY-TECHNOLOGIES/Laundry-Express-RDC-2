import {
  realApi,
  type LogisticsConnectivityHealthSummary,
  type LogisticsDriver,
  type LogisticsDriverBehaviorSummary,
  type LogisticsFuelUsageSummary,
  type LogisticsStockLevelSummary,
  type LogisticsTask,
} from './real-api';
import { mapLogisticsTaskViaTms } from '../lib/tms/generic-mission';
import type { DispatchTask, Driver, LogisticsStatus, MaintenanceEvent, TrackingPoint, Trip, Vehicle } from '../components/logistics/logistics-types';
import {
  dispatchTaskToBacklogItem,
  type DispatchBacklogItem,
  type LogisticsBacklogMission,
} from '../lib/logistics/backlog-model';

export type { DispatchBacklogItem, LogisticsBacklogMission } from '../lib/logistics/backlog-model';

export type DataMode = 'backend' | 'degraded';

export interface LogisticsMissionRow {
  id: string;
  status: string;
  driver: string;
  commune: string;
}

export interface LogisticsDriverProfile {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  vehicle: string;
  vehiclePlate: string;
  commune: string;
  email: string;
  notes: string;
  status: string;
  missionsCompleted: number;
  rating: number;
  availability: string;
  documents?: { label: string; status: 'valid' | 'expired' | 'missing' }[];
  performance?: {
    punctuality: number;
    delays: number;
    cancellations: number;
    revenue: number;
  };
}

export interface LogisticsReadyDriver {
  name: string;
  vehicle: string;
  rating: number;
  commune: string;
  status: string;
  occupation: number;
  avgTime: number;
}

export interface LogisticsShipmentRow {
  id: string;
  orderId: string;
  missionType?: 'pickup' | 'delivery';
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

export interface LogisticsAlertRow {
  id: string;
  type: 'retard' | 'attente' | 'inactif' | 'paiement';
  title: string;
  description: string;
  count: number;
  timestamp: string;
}

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
  avatarUrl: driver.avatar_url || undefined,
  status: driverStatus(driver),
  zone: 'Kinshasa',
  vehicleId: driver.license_number ? `vehicle-${driver.license_number}` : undefined,
});

export const mapLogisticsTask = (task: LogisticsTask, drivers: Driver[] = []): DispatchTask =>
  mapLogisticsTaskViaTms(task, drivers);

const formatTaskTime = (value?: string | null) => {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const statusToMissionLabel = (status: LogisticsStatus) => {
  if (status === 'pending') return 'En attente';
  if (status === 'assigned') return 'Assignée';
  if (status === 'in_transit' || status === 'delayed') return 'En cours';
  if (status === 'delivered') return 'Terminée';
  if (status === 'cancelled') return 'Annulée';
  return 'Incident';
};

export const dispatchTaskToBacklogMission = (task: DispatchTask): LogisticsBacklogMission =>
  dispatchTaskToBacklogItem(task);

export const LOGISTICS_DISPATCH_BACKLOG_KEY = 'logisticsDispatchBacklogMission';

export const storeBacklogMissionForDispatch = (mission: LogisticsBacklogMission): void => {
  sessionStorage.setItem(LOGISTICS_DISPATCH_BACKLOG_KEY, JSON.stringify(mission));
};

export const readBacklogMissionForDispatch = (missionId?: string | null): LogisticsBacklogMission | null => {
  const raw = sessionStorage.getItem(LOGISTICS_DISPATCH_BACKLOG_KEY);
  if (!raw) return null;
  try {
    const mission = JSON.parse(raw) as LogisticsBacklogMission;
    if (missionId && mission.id !== missionId) return null;
    return mission;
  } catch {
    return null;
  }
};

export const backlogMissionToDispatchTask = (mission: LogisticsBacklogMission): DispatchTask => {
  const deliveryZone = mission.delivery.split(',')[0]?.trim() || mission.commune;
  const numericId = mission.id.replace(/\D/g, '') || '0';
  return {
    id: mission.id,
    orderId: `LX-${numericId.padStart(4, '0')}`,
    shipmentId: `shp-${numericId.padStart(3, '0')}`,
    missionType: mission.type,
    status: 'pending',
    customerName: mission.client,
    pickupAddress: mission.pickup,
    pickupZone: mission.commune,
    deliveryZone,
    distanceKm: mission.distance,
    queueMinutes: Math.max(5, Math.round(mission.distance * 4)),
    priority: mission.priorite === 'Critique' || mission.priorite === 'Collecte urgente' ? 'urgent' : mission.priorite === 'Livraison critique' || mission.priorite === 'Retard' ? 'high' : 'normal',
  };
};

export const mergeFocusedBacklogIntoDispatchTasks = (
  tasks: DispatchTask[],
  focusMissionId?: string | null
): DispatchTask[] => {
  if (!focusMissionId || tasks.some((task) => task.id === focusMissionId)) return tasks;
  const backlogMission = readBacklogMissionForDispatch(focusMissionId);
  if (!backlogMission) return tasks;
  return [backlogMissionToDispatchTask(backlogMission), ...tasks];
};

export const dispatchTaskToMissionRow = (task: DispatchTask): LogisticsMissionRow => ({
  id: task.id,
  status: statusToMissionLabel(task.status),
  driver: task.driverName || 'À assigner',
  commune: task.pickupZone,
});

export const dispatchTaskToShipment = (task: DispatchTask): LogisticsShipmentRow => ({
  id: task.shipmentId,
  orderId: task.id,
  missionType: task.missionType,
  customerName: task.customerName,
  status: task.status,
  pickupZone: task.pickupZone,
  deliveryZone: task.deliveryZone,
  pickupAddress: task.pickupAddress,
  deliveryAddress: `${task.deliveryZone}, Kinshasa`,
  tripId: task.shipmentId,
  driverName: task.driverName || 'À assigner',
  vehiclePlate: task.vehicleId || 'Véhicule à confirmer',
  etaMinutes: Math.max(8, Math.round(task.distanceKm * 6)),
  createdAt: `${Math.max(5, task.queueMinutes)} min`,
  updatedAt: 'Maintenant',
  proofRequired: task.status === 'delivered',
  incidentCount: task.status === 'failed' || task.status === 'delayed' ? 1 : 0,
});

export const mapLogisticsDriverProfile = (driver: LogisticsDriver): LogisticsDriverProfile => {
  const isSuspended = driver.status === 'suspended';
  const isOffline = driver.status === 'inactive';
  const status = isSuspended ? 'Suspendu' : isOffline ? 'Hors ligne' : driver.is_available ? 'Disponible' : 'Occupé';
  const vehicle = driver.vehicle_type || 'Moto';
  const vehiclePlate = driver.license_number || 'Plaque à confirmer';
  const rating = Number(driver.rating_avg) || 0;
  return {
    id: driver.id,
    name: driver.user_name || driver.user_email || `Driver ${driver.id.slice(0, 6)}`,
    phone: driver.user_phone || '',
    avatarUrl: driver.avatar_url || undefined,
    vehicle,
    vehiclePlate,
    commune: 'Kinshasa',
    email: driver.user_email || '',
    notes: '',
    status,
    missionsCompleted: driver.rating_count || 0,
    rating,
    availability: driver.is_available ? 'Libre' : '1 mission',
    documents: [
      { label: 'Permis', status: driver.license_number ? 'valid' : 'missing' },
      { label: 'Assurance', status: 'valid' },
      { label: 'Carte véhicule', status: vehiclePlate === 'Plaque à confirmer' ? 'missing' : 'valid' },
    ],
    performance: {
      punctuality: Math.max(70, Math.min(99, Math.round(82 + rating * 3))),
      delays: driver.is_available ? 2 : 6,
      cancellations: isSuspended ? 4 : 1,
      revenue: Math.round((driver.rating_count || 1) * 850),
    },
  };
};

export const driverProfileToReadyDriver = (driver: LogisticsDriverProfile, index = 0): LogisticsReadyDriver => ({
  name: driver.name,
  vehicle: driver.vehicle,
  rating: driver.rating || 4,
  commune: driver.commune,
  status: driver.status === 'Disponible' ? 'Disponible' : 'En mission',
  occupation: driver.status === 'Disponible' ? 20 + (index % 4) * 8 : 60 + (index % 4) * 7,
  avgTime: 15 + (index % 7) * 3,
});

export const buildAlertsFromDispatch = (tasks: DispatchTask[], drivers: LogisticsDriverProfile[]): LogisticsAlertRow[] => {
  const waiting = tasks.filter((task) => task.status === 'pending');
  const late = tasks.filter((task) => task.priority === 'urgent' || task.status === 'delayed');
  const inactive = drivers.filter((driver) => driver.status === 'Hors ligne' || driver.status === 'Suspendu');
  const alerts: LogisticsAlertRow[] = [];

  late.slice(0, 4).forEach((task, index) => {
    alerts.push({
      id: `ALT-BE-LATE-${index + 1}`,
      type: 'retard',
      title: `Mission ${task.id} en retard`,
      description: `${task.driverName || 'Chauffeur à confirmer'} dépasse le SLA sur ${task.id}`,
      count: 1,
      timestamp: `${Math.max(5, task.queueMinutes)} min`,
    });
  });

  if (waiting.length > 0) {
    alerts.push({
      id: 'ALT-BE-WAITING',
      type: 'attente',
      title: `${waiting.length} missions en attente d'assignation`,
      description: `Backlog actif dans ${new Set(waiting.map((task) => task.pickupZone)).size} zone(s)`,
      count: waiting.length,
      timestamp: 'Maintenant',
    });
  }

  inactive.slice(0, 4).forEach((driver, index) => {
    alerts.push({
      id: `ALT-BE-DRIVER-${index + 1}`,
      type: 'inactif',
      title: `Chauffeur ${driver.name} inactif`,
      description: `Statut actuel: ${driver.status}`,
      count: 1,
      timestamp: 'Backend',
    });
  });

  return alerts;
};

export const taskToTrip = (task: DispatchTask): Trip => ({
  id: task.shipmentId,
  taskId: task.id,
  missionType: task.missionType,
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

export const getLogisticsDrivers = async (fallback: LogisticsDriverProfile[]): Promise<LogisticsDataResult<LogisticsDriverProfile[]>> => {
  try {
    const response = await realApi.getLogisticsDrivers({ page: 1, page_size: 100 });
    const drivers = response.drivers.map(mapLogisticsDriverProfile);
    return { data: drivers, mode: 'backend' };
  } catch (error) {
    return fallbackResult(fallback, error instanceof Error ? error.message : 'backend drivers unavailable');
  }
};

export interface LogisticsDriverCreateInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  vehicle: string;
  vehiclePlate: string;
  commune?: string;
  notes?: string;
}

export const createLogisticsDriver = async (input: LogisticsDriverCreateInput): Promise<LogisticsDriverProfile> => {
  const created = await realApi.createLogisticsDriver({
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    password: input.password,
    vehicle_type: input.vehicle,
    license_number: input.vehiclePlate || undefined,
    status: 'active',
    is_available: true,
  });
  return mapLogisticsDriverProfile(created);
};

export const getMissionRows = async (
  fallbackBacklog: LogisticsBacklogMission[] = [],
  fallbackMissions: LogisticsMissionRow[] = [],
): Promise<LogisticsDataResult<{ backlog: LogisticsBacklogMission[]; missions: LogisticsMissionRow[] }>> => {
  const result = await getDispatchTasks([]);
  if (result.data.length === 0) {
    return fallbackResult({ backlog: fallbackBacklog, missions: fallbackMissions }, result.reason || 'backend missions empty');
  }
  const openStatuses = new Set(['pending', 'open_market']);
  return {
    mode: result.mode,
    reason: result.reason,
    data: {
      backlog: result.data
        .filter((task) => task.status === 'pending' || openStatuses.has((task.taskStatus || '').toLowerCase()))
        .map(dispatchTaskToBacklogMission),
      missions: result.data.map(dispatchTaskToMissionRow),
    },
  };
};

export const getShipments = async (fallback: LogisticsShipmentRow[]): Promise<LogisticsDataResult<LogisticsShipmentRow[]>> => {
  const result = await getDispatchTasks([]);
  const shipments = result.data.map(dispatchTaskToShipment);
  return shipments.length > 0
    ? { data: shipments, mode: result.mode, reason: result.reason }
    : fallbackResult(fallback, result.reason || 'backend shipments empty');
};

export const getLogisticsAlerts = async (fallback: LogisticsAlertRow[]): Promise<LogisticsDataResult<LogisticsAlertRow[]>> => {
  try {
    const [taskResult, driverResult] = await Promise.all([
      getDispatchTasks([]),
      getLogisticsDrivers([]),
    ]);
    const alerts = buildAlertsFromDispatch(taskResult.data, driverResult.data);
    return alerts.length > 0
      ? { data: alerts, mode: taskResult.mode === 'backend' || driverResult.mode === 'backend' ? 'backend' : 'degraded' }
      : fallbackResult(fallback, taskResult.reason || driverResult.reason || 'backend alerts empty');
  } catch (error) {
    return fallbackResult(fallback, error instanceof Error ? error.message : 'backend alerts unavailable');
  }
};

export const getVehicles = async (fallback: Vehicle[]): Promise<LogisticsDataResult<Vehicle[]>> => {
  try {
    const response = await realApi.getVehicles();
    return { data: response.vehicles, mode: 'backend' };
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

export const getDriverBehavior = async (
  fallback: LogisticsDriverBehaviorSummary,
): Promise<LogisticsDataResult<LogisticsDriverBehaviorSummary>> => {
  try {
    return { data: await realApi.getDriverBehavior(), mode: 'backend' };
  } catch (error) {
    return fallbackResult(fallback, error instanceof Error ? error.message : 'backend driver behavior unavailable');
  }
};

export const getFuelUsage = async (
  fallback: LogisticsFuelUsageSummary,
): Promise<LogisticsDataResult<LogisticsFuelUsageSummary>> => {
  try {
    return { data: await realApi.getFuelUsage(), mode: 'backend' };
  } catch (error) {
    return fallbackResult(fallback, error instanceof Error ? error.message : 'backend fuel usage unavailable');
  }
};

export const getStockLevels = async (
  fallback: LogisticsStockLevelSummary,
): Promise<LogisticsDataResult<LogisticsStockLevelSummary>> => {
  try {
    return { data: await realApi.getStockLevels(), mode: 'backend' };
  } catch (error) {
    return fallbackResult(fallback, error instanceof Error ? error.message : 'backend stock levels unavailable');
  }
};

export const getConnectivityHealth = async (
  fallback: LogisticsConnectivityHealthSummary,
): Promise<LogisticsDataResult<LogisticsConnectivityHealthSummary>> => {
  try {
    return { data: await realApi.getConnectivityHealth(), mode: 'backend' };
  } catch (error) {
    return fallbackResult(fallback, error instanceof Error ? error.message : 'backend connectivity health unavailable');
  }
};
