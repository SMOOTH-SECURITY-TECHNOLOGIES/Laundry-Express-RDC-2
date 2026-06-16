import { Order, OrderStatus, SupportTicket, User } from '../../types';

export type PilotMetricDirection = 'up' | 'down' | 'stable';
export type PilotMetricHealth = 'good' | 'watch' | 'risk';

export interface PilotMetric {
  key: string;
  label: string;
  value: string;
  rawValue: number;
  direction: PilotMetricDirection;
  health: PilotMetricHealth;
  question: string;
}

export interface PilotDashboardSummary {
  generatedAt: string;
  metrics: PilotMetric[];
  freezePolicy: {
    featuresFrozen: boolean;
    instrumentationOpen: boolean;
    rule: string;
  };
}

interface BuildPilotMetricsInput {
  users: User[];
  orders: Order[];
  supportTickets?: SupportTicket[];
  platformFeeRate?: number;
  now?: Date;
}

const MS_PER_MINUTE = 60 * 1000;

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function money(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} $`;
}

function minutesBetween(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return Math.round((end - start) / MS_PER_MINUTE);
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function statusTime(order: Order, status: OrderStatus): string | undefined {
  return order.trackingHistory.find((entry) => entry.status === status)?.time;
}

function metric(
  key: string,
  label: string,
  rawValue: number,
  value: string,
  question: string,
  health: PilotMetricHealth,
  direction: PilotMetricDirection = 'stable',
): PilotMetric {
  return { key, label, rawValue, value, question, health, direction };
}

export function buildPilotDashboardSummary(input: BuildPilotMetricsInput): PilotDashboardSummary {
  const { users, orders, supportTickets = [], platformFeeRate = 0.15, now = new Date() } = input;
  const completedOrders = orders.filter((order) => order.status === OrderStatus.COMPLETED);
  const paidOrCompletedOrders = orders.filter((order) => order.paymentStatus === 'paid' || order.status === OrderStatus.COMPLETED);

  const customerIds = new Set(orders.map((order) => order.userId));
  const newClients = users.filter((user) => user.role === 'customer' && customerIds.has(user.id)).length;
  const firstOrders = new Set(orders.map((order) => order.userId)).size;
  const completionRate = pct(completedOrders.length, orders.length);

  const ordersByCustomer = orders.reduce<Map<string, Order[]>>((map, order) => {
    const current = map.get(order.userId) || [];
    current.push(order);
    map.set(order.userId, current);
    return map;
  }, new Map());
  const repeatCustomers = Array.from(ordersByCustomer.values()).filter((customerOrders) => customerOrders.length >= 2).length;
  const repeatOrderRate = pct(repeatCustomers, ordersByCustomer.size);

  const attributionMinutes = orders
    .map((order) => minutesBetween(order.createdAt, statusTime(order, OrderStatus.CONFIRMED) || statusTime(order, OrderStatus.READY_FOR_PICKUP)))
    .filter((value): value is number => value !== null);

  const pickupMinutes = orders
    .map((order) => minutesBetween(order.createdAt, statusTime(order, OrderStatus.PICKUP)))
    .filter((value): value is number => value !== null);

  const deliveryMinutes = completedOrders
    .map((order) => minutesBetween(statusTime(order, OrderStatus.READY_FOR_DELIVERY) || statusTime(order, OrderStatus.DELIVERY), statusTime(order, OrderStatus.COMPLETED)))
    .filter((value): value is number => value !== null);

  const claims = supportTickets.filter((ticket) => Boolean(ticket.orderId)).length;
  const partnerRevenue = paidOrCompletedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  const platformRevenue = paidOrCompletedOrders.reduce((sum, order) => sum + order.totalPrice * platformFeeRate, 0);

  const avgAttribution = average(attributionMinutes);
  const avgPickup = average(pickupMinutes);
  const avgDelivery = average(deliveryMinutes);

  return {
    generatedAt: now.toISOString(),
    freezePolicy: {
      featuresFrozen: true,
      instrumentationOpen: true,
      rule: 'Freeze features, keep instrumentation open.',
    },
    metrics: [
      metric('new_clients', 'Nouveaux clients', newClients, String(newClients), 'Les clients entrent-ils dans le systeme ?', newClients > 0 ? 'good' : 'watch', 'up'),
      metric('first_orders', 'Premieres commandes', firstOrders, String(firstOrders), 'Les clients passent-ils une premiere commande ?', firstOrders > 0 ? 'good' : 'risk', 'up'),
      metric('completion_rate', 'Taux de completion', completionRate, `${completionRate}%`, 'Les clients terminent-ils leur premiere commande ?', completionRate >= 70 ? 'good' : completionRate >= 45 ? 'watch' : 'risk', 'up'),
      metric('attribution_time', 'Temps attribution', avgAttribution, avgAttribution ? `${avgAttribution} min` : 'n/a', 'Une commande trouve-t-elle rapidement un partenaire ?', avgAttribution > 0 && avgAttribution <= 30 ? 'good' : avgAttribution <= 60 ? 'watch' : 'risk', 'down'),
      metric('pickup_time', 'Temps collecte', avgPickup, avgPickup ? `${avgPickup} min` : 'n/a', 'La collecte devient-elle un goulot operationnel ?', avgPickup > 0 && avgPickup <= 45 ? 'good' : avgPickup <= 90 ? 'watch' : 'risk', 'down'),
      metric('delivery_time', 'Temps livraison', avgDelivery, avgDelivery ? `${avgDelivery} min` : 'n/a', 'La livraison reste-t-elle sous controle ?', avgDelivery > 0 && avgDelivery <= 60 ? 'good' : avgDelivery <= 120 ? 'watch' : 'risk', 'down'),
      metric('claims', 'Reclamations', claims, String(claims), 'Les frictions client remontent-elles ?', claims <= Math.max(1, orders.length * 0.05) ? 'good' : claims <= Math.max(2, orders.length * 0.12) ? 'watch' : 'risk', 'down'),
      metric('repeat_order_rate', 'Taux de reachat', repeatOrderRate, `${repeatOrderRate}%`, 'Les clients reviennent-ils ?', repeatOrderRate >= 25 ? 'good' : repeatOrderRate >= 10 ? 'watch' : 'risk', 'up'),
      metric('platform_revenue', 'Revenu plateforme', platformRevenue, money(platformRevenue), 'La plateforme capture-t-elle de la valeur ?', platformRevenue > 0 ? 'good' : 'watch', 'up'),
      metric('partner_revenue', 'Revenu partenaires', partnerRevenue, money(partnerRevenue), 'Les partenaires gagnent-ils plus ?', partnerRevenue > 0 ? 'good' : 'risk', 'up'),
    ],
  };
}
