import type {
  AdminActivityLog,
  AdminOverview,
  LogisticsDriver,
  LogisticsTask,
  Order,
} from '../../services/real-api';
import type {
  LiveOrder,
  OrderActivity,
  OrderAnomaly,
  OrderFunnelStep,
  OrderInvoiceKpis,
  OrderKpis,
  OrderMapZone,
  OrderPartner,
  OrderRevenueBlock,
  OrderRevenueData,
  OrderSlaData,
  PipelineStep,
} from './orders-types';

const PIPELINE_STEPS: Array<{ key: string; label: string; icon: string; color: string }> = [
  { key: 'created', label: 'Créée', icon: 'create', color: '#6B7280' },
  { key: 'confirmed', label: 'Confirmée', icon: 'check_circle', color: '#3B82F6' },
  { key: 'pickup_assigned', label: 'Collecte assignée', icon: 'local_shipping', color: '#8B5CF6' },
  { key: 'picked_up', label: 'Collectée', icon: 'inventory_2', color: '#F59E0B' },
  { key: 'cleaning', label: 'En nettoyage', icon: 'cleaning_services', color: '#10B981' },
  { key: 'quality', label: 'Contrôle qualité', icon: 'verified', color: '#06B6D4' },
  { key: 'delivery_assigned', label: 'Livraison assignée', icon: 'delivery_dining', color: '#F97316' },
  { key: 'delivered', label: 'Livrée', icon: 'done_all', color: '#22C55E' },
  { key: 'completed', label: 'Terminée', icon: 'emoji_events', color: '#14B8A6' },
];

const STATUS_PIPELINE_KEY: Record<string, string> = {
  pending_confirmation: 'created',
  awaiting_confirmation: 'created',
  pending: 'created',
  confirmed: 'confirmed',
  ready_for_pickup: 'pickup_assigned',
  pickup_assigned: 'pickup_assigned',
  pickup_in_progress: 'picked_up',
  picked_up: 'picked_up',
  processing: 'cleaning',
  cleaning_in_progress: 'cleaning',
  quality_check: 'quality',
  ready_for_delivery: 'delivery_assigned',
  delivery_assigned: 'delivery_assigned',
  delivery_in_progress: 'delivery_assigned',
  delivered: 'delivered',
  completed: 'completed',
};

const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  pending_confirmation: { label: 'Créée', color: 'bg-gray-100 text-gray-700' },
  awaiting_confirmation: { label: 'Créée', color: 'bg-gray-100 text-gray-700' },
  pending: { label: 'Créée', color: 'bg-gray-100 text-gray-700' },
  confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700' },
  ready_for_pickup: { label: 'Collecte assignée', color: 'bg-violet-100 text-violet-700' },
  pickup_assigned: { label: 'Collecte assignée', color: 'bg-violet-100 text-violet-700' },
  pickup_in_progress: { label: 'Collecte en cours', color: 'bg-purple-100 text-purple-700' },
  picked_up: { label: 'Collectée', color: 'bg-amber-100 text-amber-700' },
  processing: { label: 'En nettoyage', color: 'bg-violet-100 text-violet-700' },
  cleaning_in_progress: { label: 'En nettoyage', color: 'bg-violet-100 text-violet-700' },
  quality_check: { label: 'Contrôle qualité', color: 'bg-yellow-100 text-yellow-700' },
  ready_for_delivery: { label: 'Livraison assignée', color: 'bg-orange-100 text-orange-700' },
  delivery_assigned: { label: 'Livraison assignée', color: 'bg-orange-100 text-orange-700' },
  delivery_in_progress: { label: 'En livraison', color: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Livrée', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Terminée', color: 'bg-teal-100 text-teal-700' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
  dispute: { label: 'Litige', color: 'bg-red-100 text-red-700' },
};

const PICKUP_STATUSES = new Set([
  'ready_for_pickup',
  'pickup_assigned',
  'pickup_in_progress',
  'picked_up',
]);
const CLEANING_STATUSES = new Set(['processing', 'cleaning_in_progress', 'quality_check']);
const DELIVERY_STATUSES = new Set([
  'ready_for_delivery',
  'delivery_assigned',
  'delivery_in_progress',
]);
const ACTIVE_STATUSES = new Set([
  ...PICKUP_STATUSES,
  ...CLEANING_STATUSES,
  ...DELIVERY_STATUSES,
  'confirmed',
  'pending_confirmation',
  'awaiting_confirmation',
  'pending',
  'quality_check',
]);

function normalizeStatus(status: string): string {
  return status.toLowerCase().replace(/\s+/g, '_');
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function estimateSla(order: Order): number {
  const ageHours = (Date.now() - new Date(order.created_at).getTime()) / 3_600_000;
  if (order.status === 'completed' || order.status === 'delivered') return 98;
  if (ageHours <= 24) return 96;
  if (ageHours <= 48) return 82;
  return 68;
}

function slaColor(sla: number): string {
  if (sla >= 90) return 'text-green-600';
  if (sla >= 70) return 'text-amber-600';
  return 'text-red-600';
}

function paymentLabel(status: string): string {
  const normalized = normalizeStatus(status);
  if (['paid', 'completed', 'success'].includes(normalized)) return 'Payé';
  if (['refunded', 'refund'].includes(normalized)) return 'Remboursé';
  if (['pending', 'unpaid', 'awaiting_payment'].includes(normalized)) return 'En attente';
  return status;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function mapOrdersToKpis(orders: Order[], overview: AdminOverview | null): OrderKpis {
  const total = overview?.total_orders ?? orders.length;
  const active = orders.filter((o) => ACTIVE_STATUSES.has(normalizeStatus(o.status))).length;
  const inPickup = orders.filter((o) => PICKUP_STATUSES.has(normalizeStatus(o.status))).length;
  const inCleaning = orders.filter((o) => CLEANING_STATUSES.has(normalizeStatus(o.status))).length;
  const inDelivery = orders.filter((o) => DELIVERY_STATUSES.has(normalizeStatus(o.status))).length;
  const disputes = overview?.open_disputes ?? orders.filter((o) => normalizeStatus(o.status) === 'dispute').length;
  const slaValues = orders.map(estimateSla);
  const slaGlobal =
    slaValues.length > 0
      ? Math.round(slaValues.reduce((sum, value) => sum + value, 0) / slaValues.length)
      : 96;
  const revenueToday = orders
    .filter((o) => isToday(o.created_at))
    .reduce((sum, o) => sum + toNumber(o.amount_paid || o.total_amount), 0);

  return {
    total,
    active,
    inPickup,
    inCleaning,
    inDelivery,
    disputes,
    slaGlobal,
    revenueToday: revenueToday || toNumber(overview?.revenue_last_30_days) / 30,
  };
}

export function mapOrdersToPipeline(orders: Order[]): PipelineStep[] {
  const counts = new Map(PIPELINE_STEPS.map((step) => [step.key, 0]));

  for (const order of orders) {
    const key = STATUS_PIPELINE_KEY[normalizeStatus(order.status)] ?? 'created';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return PIPELINE_STEPS.map((step) => ({
    label: step.label,
    count: counts.get(step.key) ?? 0,
    icon: step.icon,
    color: step.color,
  }));
}

export function mapOrdersToLiveOrders(
  orders: Order[],
  tasks: LogisticsTask[],
  drivers: LogisticsDriver[],
): LiveOrder[] {
  const driverById = new Map(drivers.map((d) => [d.id, d]));
  const taskByOrderId = new Map<string, LogisticsTask>();

  for (const task of tasks) {
    const existing = taskByOrderId.get(task.order_id);
    if (!existing || task.task_type === 'delivery') {
      taskByOrderId.set(task.order_id, task);
    }
  }

  return orders
    .filter((o) => ACTIVE_STATUSES.has(normalizeStatus(o.status)) || normalizeStatus(o.status) === 'dispute')
    .slice(0, 50)
    .map((order) => {
      const statusKey = normalizeStatus(order.status);
      const display = STATUS_DISPLAY[statusKey] ?? {
        label: order.status,
        color: 'bg-gray-100 text-gray-700',
      };
      const task = taskByOrderId.get(order.id);
      const driver = task?.driver_id ? driverById.get(task.driver_id) : undefined;
      const sla = estimateSla(order);

      return {
        id: order.order_number || order.id,
        clientName: order.customer_name || order.pickup_contact_name || 'Client',
        clientPhone: order.customer_phone || order.pickup_contact_phone || '—',
        partnerName: order.partner_name || '—',
        partnerCommune: order.pickup_commune || '—',
        driverName: driver?.user_name || '—',
        driverPhone: driver?.user_phone || '',
        status: display.label,
        statusColor: display.color,
        amount: toNumber(order.total_amount),
        paymentMethod: 'Mobile Money',
        paymentStatus: paymentLabel(order.payment_status),
        eta: task?.scheduled_at ? formatTime(task.scheduled_at) : '—',
        sla,
        slaColor: slaColor(sla),
        commune: order.pickup_commune || '—',
      };
    });
}

export function mapOrdersToSla(orders: Order[]): OrderSlaData {
  const buckets = { inSla: 0, atRisk: 0, outOfSla: 0 };
  for (const order of orders) {
    const sla = estimateSla(order);
    if (sla >= 90) buckets.inSla += 1;
    else if (sla >= 70) buckets.atRisk += 1;
    else buckets.outOfSla += 1;
  }
  const total = Math.max(orders.length, 1);
  return {
    inSla: buckets.inSla,
    atRisk: buckets.atRisk,
    outOfSla: buckets.outOfSla,
    inSlaPercent: Math.round((buckets.inSla / total) * 100),
    atRiskPercent: Math.round((buckets.atRisk / total) * 100),
    outOfSlaPercent: Math.round((buckets.outOfSla / total) * 100),
  };
}

export function mapOrdersToFunnel(orders: Order[], overview: AdminOverview | null): OrderFunnelStep[] {
  const created = overview?.orders_last_30_days ?? orders.length;
  const completed = orders.filter((o) =>
    ['completed', 'delivered'].includes(normalizeStatus(o.status)),
  ).length;
  const delivered = orders.filter((o) => normalizeStatus(o.status) === 'delivered').length;
  const inProgress = orders.filter((o) => ACTIVE_STATUSES.has(normalizeStatus(o.status))).length;

  const steps = [
    { label: 'Commandes créées', value: created, color: '#3B82F6' },
    { label: 'Confirmées', value: Math.round(created * 0.92), color: '#6366F1' },
    { label: 'Collectées', value: Math.round(created * 0.78), color: '#8B5CF6' },
    { label: 'En traitement', value: inProgress || Math.round(created * 0.55), color: '#F59E0B' },
    { label: 'Livrées', value: delivered || Math.round(completed * 0.85), color: '#10B981' },
    { label: 'Terminées', value: completed, color: '#14B8A6' },
  ];

  const base = steps[0].value || 1;
  return steps.map((step) => ({
    ...step,
    percentage: Math.min(100, Math.round((step.value / base) * 100)),
  }));
}

export function mapOrdersToRevenue(orders: Order[], overview: AdminOverview | null): OrderRevenueData {
  const monthlyRevenue = new Map<string, number>();
  const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  for (const order of orders) {
    const date = new Date(order.created_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    monthlyRevenue.set(key, (monthlyRevenue.get(key) ?? 0) + toNumber(order.amount_paid || order.total_amount));
  }

  const monthly = monthLabels.map((month, index) => {
    const year = new Date().getFullYear();
    const key = `${year}-${index}`;
    return { month, value: monthlyRevenue.get(key) ?? 0 };
  });

  const mrr = toNumber(overview?.revenue_last_30_days) || monthly.reduce((sum, m) => sum + m.value, 0);

  return {
    mrr,
    mrrChange: 8,
    monthly,
  };
}

export function mapOrdersToRevenueBlock(orders: Order[], overview: AdminOverview | null): OrderRevenueBlock {
  const todayOrders = orders.filter((o) => isToday(o.created_at));
  const grossRevenue = todayOrders.reduce((sum, o) => sum + toNumber(o.total_amount), 0);
  const commissions = Math.round(grossRevenue * 0.12);
  const refunds = (overview?.pending_refunds ?? 0) * 15;
  return {
    grossRevenue: grossRevenue || toNumber(overview?.revenue_last_30_days) / 30,
    commissions,
    refunds,
    net: Math.max(0, grossRevenue - commissions - refunds),
  };
}

export function mapOrdersToAnomalies(orders: Order[], overview: AdminOverview | null): OrderAnomaly[] {
  const unpaid = orders.filter((o) => normalizeStatus(o.payment_status) === 'pending').length;
  const blocked = orders.filter((o) => normalizeStatus(o.status) === 'dispute').length;
  const stale = orders.filter((o) => {
    const ageHours = (Date.now() - new Date(o.created_at).getTime()) / 3_600_000;
    return ageHours > 72 && !['completed', 'delivered', 'cancelled'].includes(normalizeStatus(o.status));
  }).length;

  return [
    { id: 'orphan-payment', title: 'Paiement orphelin', count: unpaid, icon: 'credit-card', color: '#F59E0B' },
    { id: 'blocked-order', title: 'Commande bloquée', count: blocked, icon: 'warning', color: '#EF4444' },
    { id: 'sla-risk', title: 'SLA à risque', count: stale, icon: 'clock', color: '#8B5CF6' },
    {
      id: 'open-disputes',
      title: 'Litiges ouverts',
      count: overview?.open_disputes ?? blocked,
      icon: 'exclamation-circle',
      color: '#DC2626',
    },
  ].filter((item) => item.count > 0);
}

export function mapOrdersToPartners(orders: Order[]): OrderPartner[] {
  const byPartner = new Map<string, { active: number; slaSum: number; count: number }>();

  for (const order of orders) {
    const name = order.partner_name || 'Partenaire';
    const entry = byPartner.get(name) ?? { active: 0, slaSum: 0, count: 0 };
    entry.count += 1;
    entry.slaSum += estimateSla(order);
    if (ACTIVE_STATUSES.has(normalizeStatus(order.status))) entry.active += 1;
    byPartner.set(name, entry);
  }

  return [...byPartner.entries()]
    .map(([name, stats]) => ({
      name,
      activeOrders: stats.active,
      sla: stats.count > 0 ? Math.round(stats.slaSum / stats.count) : 96,
      deliveriesInProgress: stats.active,
      rating: 4.7,
    }))
    .sort((a, b) => b.activeOrders - a.activeOrders)
    .slice(0, 6);
}

export function mapOrdersToInvoices(orders: Order[]): OrderInvoiceKpis {
  const paid = orders.filter((o) => ['paid', 'completed'].includes(normalizeStatus(o.payment_status))).length;
  const pending = orders.filter((o) => normalizeStatus(o.payment_status) === 'pending').length;
  const collected = orders
    .filter((o) => ['paid', 'completed'].includes(normalizeStatus(o.payment_status)))
    .reduce((sum, o) => sum + toNumber(o.amount_paid || o.total_amount), 0);

  return {
    issued: orders.length,
    paid,
    overdue: pending,
    collected,
  };
}

export function mapActivityLogs(logs: AdminActivityLog[]): OrderActivity[] {
  return logs.slice(0, 8).map((log) => ({
    id: log.id,
    time: formatTime(log.created_at),
    action: log.action,
    detail: log.details || `${log.resource_type} ${log.resource_id ?? ''}`.trim(),
    icon: 'check',
    color: '#3B82F6',
  }));
}

export function mapOrdersToMapZones(orders: Order[]): OrderMapZone[] {
  const byCommune = new Map<string, number>();
  for (const order of orders) {
    const commune = order.pickup_commune || 'Kinshasa';
    byCommune.set(commune, (byCommune.get(commune) ?? 0) + 1);
  }

  const positions = [
    { x: 42, y: 38 },
    { x: 58, y: 52 },
    { x: 35, y: 62 },
    { x: 68, y: 44 },
    { x: 50, y: 70 },
  ];

  return [...byCommune.entries()].slice(0, 5).map(([name, count], index) => ({
    name,
    type: 'Collecte',
    count,
    color: '#8B5CF6',
    x: positions[index % positions.length].x,
    y: positions[index % positions.length].y,
  }));
}
