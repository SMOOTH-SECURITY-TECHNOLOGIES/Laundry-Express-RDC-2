import type { LogisticsTask } from '../../services/real-api';
import type { DispatchTask } from '../../components/logistics/logistics-types';

export type BacklogMissionType = 'pickup' | 'delivery';

export type BacklogPriority =
  | 'Critique'
  | 'Collecte urgente'
  | 'Livraison critique'
  | 'Retard'
  | 'Standard';

export interface DispatchBacklogItem {
  mission_id: string;
  type: BacklogMissionType;
  client: string;
  adresse: string;
  commune: string;
  montant: number;
  distance: number;
  eta: string;
  priorite: BacklogPriority;
  statut: string;
  /** Compatibilité historique */
  id: string;
  pickup: string;
  delivery: string;
  amount: number;
  time: string;
}

const OPEN_STATUSES = new Set(['pending', 'open_market']);

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatTaskTime = (value?: string | null) => {
  const date = parseDate(value);
  if (!date) return 'À planifier';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const computeEta = (task: { scheduled_at?: string | null; created_at?: string | null }) => {
  const scheduled = parseDate(task.scheduled_at);
  if (scheduled) return formatTaskTime(task.scheduled_at);
  const created = parseDate(task.created_at);
  if (!created) return 'À planifier';
  const waitMinutes = Math.max(0, Math.round((Date.now() - created.getTime()) / 60000));
  return waitMinutes > 45 ? `+${waitMinutes} min` : `~${Math.max(15, 30 - waitMinutes % 20)} min`;
};

const statusIn = (status: string | null | undefined, values: string[]) =>
  values.includes((status || '').toLowerCase());

export const backlogPriorityFromTask = (task: {
  task_type?: string;
  status?: string;
}): BacklogPriority => {
  const status = (task.status || '').toLowerCase();
  if (statusIn(status, ['failed', 'expired'])) return 'Critique';
  if (task.task_type === 'pickup' && statusIn(status, ['pending', 'open_market'])) return 'Collecte urgente';
  if (task.task_type === 'delivery' && statusIn(status, ['pending', 'open_market', 'claimed'])) return 'Livraison critique';
  if (statusIn(status, ['pending', 'open_market'])) return 'Retard';
  return 'Standard';
};

export const backlogPriorityFromDispatch = (task: DispatchTask): BacklogPriority => {
  if (task.priority === 'urgent') return 'Critique';
  if (task.priority === 'high') return 'Collecte urgente';
  return 'Standard';
};

const estimateMontant = (distanceKm: number) => Math.max(2000, Math.round(2000 + distanceKm * 650));

const taskStatusLabel = (status: string) => {
  switch (status) {
    case 'open_market':
      return 'Marché ouvert';
    case 'pending':
      return 'En attente';
    case 'claimed':
      return 'Réservée';
    default:
      return status;
  }
};

export const logisticsTaskToBacklogItem = (task: LogisticsTask): DispatchBacklogItem => {
  const pickup = task.pickup_address_line || task.pickup_commune || 'Adresse à confirmer';
  const delivery = task.delivery_address_line || task.delivery_commune || 'Destination à confirmer';
  const commune = task.pickup_commune || task.delivery_commune || 'Kinshasa';
  const distance = commune ? Number((1.2 + (commune.length % 5) * 0.7).toFixed(1)) : 0;
  const montant = estimateMontant(distance);
  const eta = computeEta(task);
  const priorite = backlogPriorityFromTask(task);
  const statut = taskStatusLabel(task.status);

  return {
    mission_id: task.id,
    id: task.id,
    type: task.task_type,
    client: task.customer_name || 'Client',
    adresse: pickup,
    pickup,
    delivery: `${delivery}, Kinshasa`,
    commune,
    montant,
    amount: montant,
    distance,
    eta,
    time: eta,
    priorite,
    statut,
  };
};

export const dispatchTaskToBacklogItem = (task: DispatchTask): DispatchBacklogItem => {
  const montant = estimateMontant(task.distanceKm);
  const eta = task.queueMinutes > 0 ? `~${task.queueMinutes} min` : 'À planifier';
  const priorite = backlogPriorityFromDispatch(task);
  const statut = task.status === 'pending' ? 'En attente' : task.status === 'assigned' ? 'Assignée' : 'En cours';

  return {
    mission_id: task.id,
    id: task.id,
    type: 'pickup',
    client: task.customerName,
    adresse: task.pickupAddress,
    pickup: task.pickupAddress,
    delivery: `${task.deliveryZone}, Kinshasa`,
    commune: task.pickupZone,
    montant,
    amount: montant,
    distance: task.distanceKm,
    eta,
    time: eta,
    priorite,
    statut,
  };
};

export const backlogItemsFromLogisticsTasks = (tasks: LogisticsTask[]): DispatchBacklogItem[] =>
  tasks
    .filter((task) => OPEN_STATUSES.has((task.status || '').toLowerCase()))
    .map(logisticsTaskToBacklogItem);

export const backlogItemsFromDispatchTasks = (tasks: DispatchTask[]): DispatchBacklogItem[] =>
  tasks.filter((task) => task.status === 'pending').map(dispatchTaskToBacklogItem);

/** @deprecated Utiliser DispatchBacklogItem */
export type LogisticsBacklogMission = DispatchBacklogItem;
