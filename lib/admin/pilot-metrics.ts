import { Order, OrderStatus, SupportTicket, User } from '../../types';

export type PilotMetricDirection = 'up' | 'down' | 'stable';
export type PilotMetricHealth = 'good' | 'watch' | 'risk';
export type PilotDecisionState = 'GO' | 'WATCH' | 'STOP';

export interface PilotMetric {
  key: string;
  label: string;
  value: string;
  rawValue: number;
  direction: PilotMetricDirection;
  health: PilotMetricHealth;
  question: string;
  decisionState: PilotDecisionState;
  thresholds: {
    go: string;
    watch: string;
    stop: string;
  };
  action: string;
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
  thresholds: PilotMetric['thresholds'],
  action: string,
  direction: PilotMetricDirection = 'stable',
): PilotMetric {
  const decisionState: PilotDecisionState = health === 'good' ? 'GO' : health === 'watch' ? 'WATCH' : 'STOP';
  return { key, label, rawValue, value, question, health, direction, decisionState, thresholds, action };
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
      metric(
        'new_clients',
        'Nouveaux clients',
        newClients,
        String(newClients),
        'Les clients entrent-ils dans le systeme ?',
        newClients >= 10 ? 'good' : newClients >= 3 ? 'watch' : 'risk',
        { go: '>= 10 nouveaux clients', watch: '3-9 nouveaux clients', stop: '< 3 nouveaux clients' },
        'STOP: revoir acquisition terrain et canaux. WATCH: renforcer activation locale. GO: continuer le pilote.',
        'up',
      ),
      metric(
        'first_orders',
        'Premieres commandes',
        firstOrders,
        String(firstOrders),
        'Les clients passent-ils une premiere commande ?',
        firstOrders >= 8 ? 'good' : firstOrders >= 3 ? 'watch' : 'risk',
        { go: '>= 8 premieres commandes', watch: '3-7 premieres commandes', stop: '< 3 premieres commandes' },
        'STOP: simplifier onboarding et offre premiere commande. WATCH: observer les abandons. GO: maintenir.',
        'up',
      ),
      metric(
        'completion_rate',
        'Taux de completion',
        completionRate,
        `${completionRate}%`,
        'Les clients terminent-ils leur premiere commande ?',
        completionRate >= 70 ? 'good' : completionRate >= 50 ? 'watch' : 'risk',
        { go: '> 70%', watch: '50-70%', stop: '< 50%' },
        'STOP: arreter les ajouts produit et corriger le corridor commande-paiement-livraison. WATCH: auditer les abandons. GO: continuer.',
        'up',
      ),
      metric(
        'attribution_time',
        'Temps attribution',
        avgAttribution,
        avgAttribution ? `${avgAttribution} min` : 'n/a',
        'Une commande trouve-t-elle rapidement un partenaire ?',
        avgAttribution > 0 && avgAttribution <= 30 ? 'good' : avgAttribution > 0 && avgAttribution <= 60 ? 'watch' : 'risk',
        { go: '<= 30 min', watch: '31-60 min', stop: '> 60 min ou n/a' },
        'STOP: reduire zone, ajouter partenaires disponibles ou revoir dispatch. WATCH: suivre refus/reassignations. GO: maintenir.',
        'down',
      ),
      metric(
        'pickup_time',
        'Temps collecte',
        avgPickup,
        avgPickup ? `${avgPickup} min` : 'n/a',
        'La collecte devient-elle un goulot operationnel ?',
        avgPickup > 0 && avgPickup <= 45 ? 'good' : avgPickup > 0 && avgPickup <= 90 ? 'watch' : 'risk',
        { go: '<= 45 min', watch: '46-90 min', stop: '> 90 min ou n/a' },
        'STOP: limiter volumes ou renforcer chauffeurs. WATCH: optimiser zones et horaires. GO: maintenir.',
        'down',
      ),
      metric(
        'delivery_time',
        'Temps livraison',
        avgDelivery,
        avgDelivery ? `${avgDelivery} min` : 'n/a',
        'La livraison reste-t-elle sous controle ?',
        avgDelivery > 0 && avgDelivery <= 60 ? 'good' : avgDelivery > 0 && avgDelivery <= 120 ? 'watch' : 'risk',
        { go: '<= 60 min', watch: '61-120 min', stop: '> 120 min ou n/a' },
        'STOP: traiter le goulot livraison avant croissance. WATCH: surveiller SLA. GO: maintenir.',
        'down',
      ),
      metric(
        'claims',
        'Reclamations',
        claims,
        String(claims),
        'Les frictions client remontent-elles ?',
        claims <= Math.max(1, orders.length * 0.05) ? 'good' : claims <= Math.max(2, orders.length * 0.12) ? 'watch' : 'risk',
        { go: '<= 5% des commandes', watch: '5-12% des commandes', stop: '> 12% des commandes' },
        'STOP: corriger qualite/service avant acquisition. WATCH: classifier causes. GO: maintenir.',
        'down',
      ),
      metric(
        'repeat_order_rate',
        'Taux de reachat',
        repeatOrderRate,
        `${repeatOrderRate}%`,
        'Les clients reviennent-ils ?',
        repeatOrderRate >= 25 ? 'good' : repeatOrderRate >= 10 ? 'watch' : 'risk',
        { go: '>= 25%', watch: '10-24%', stop: '< 10%' },
        'STOP: revoir experience, prix et relance post-commande. WATCH: lancer reactivation mesuree. GO: augmenter retention.',
        'up',
      ),
      metric(
        'platform_revenue',
        'Revenu plateforme',
        platformRevenue,
        money(platformRevenue),
        'La plateforme capture-t-elle de la valeur ?',
        platformRevenue >= 100 ? 'good' : platformRevenue > 0 ? 'watch' : 'risk',
        { go: '>= 100 $', watch: '1-99 $', stop: '0 $' },
        'STOP: verifier paiement, commission et pricing. WATCH: suivre marge. GO: continuer.',
        'up',
      ),
      metric(
        'partner_revenue',
        'Revenu partenaires',
        partnerRevenue,
        money(partnerRevenue),
        'Les partenaires gagnent-ils plus ?',
        partnerRevenue >= 500 ? 'good' : partnerRevenue > 0 ? 'watch' : 'risk',
        { go: '>= 500 $', watch: '1-499 $', stop: '0 $' },
        'STOP: verifier demande et economie partenaire. WATCH: interviewer partenaires. GO: continuer.',
        'up',
      ),
    ],
  };
}
