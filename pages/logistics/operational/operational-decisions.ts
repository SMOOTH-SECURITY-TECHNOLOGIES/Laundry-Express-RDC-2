import type {
  AdminSupportTicket,
  LogisticsDriver,
  LogisticsTask,
  Order,
} from '../../../services/real-api';
import { minutesAgoLabel, statusIn, toNumber } from './operational-utils';

export type DecisionPriority = 'critical' | 'high' | 'medium';

export type OperationalDecision = {
  id: string;
  priority: DecisionPriority;
  kind?: 'mission' | 'capacity' | 'network';
  missionId?: string;
  reference: string;
  observation: string;
  impact: string;
  suggestion: string;
  actionLabel: string;
  actionSection: 'dispatch' | 'drivers' | 'alerts';
  suggestedDriverId?: string;
  suggestedDriverName?: string;
  delayMinutes?: number;
  sortScore: number;
};

const PRIORITY_SCORE: Record<DecisionPriority, number> = {
  critical: 300,
  high: 200,
  medium: 100,
};

const DELAY_THRESHOLD_MIN = 15;
const PENDING_ASSIGN_THRESHOLD_MIN = 10;
const PREMIUM_AMOUNT_CDF = 45_000;

const missionRef = (task: LogisticsTask) => task.order_number || `MSN-${task.id.slice(0, 6).toUpperCase()}`;

const ageMinutes = (value?: string | null) => {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return 0;
  return Math.max(0, Math.round((Date.now() - ts) / 60000));
};

const pickBestDriver = (drivers: LogisticsDriver[]): LogisticsDriver | undefined =>
  [...drivers]
    .filter((driver) => driver.status === 'active' && driver.is_available)
    .sort((a, b) => Number(b.rating_avg || 0) - Number(a.rating_avg || 0))[0];

const isPremiumOrder = (order?: Order) => {
  if (!order) return false;
  if (toNumber(order.total_amount) >= PREMIUM_AMOUNT_CDF) return true;
  const partner = (order.partner_name || '').toLowerCase();
  return partner.includes('prestige') || partner.includes('premium') || partner.includes('vip');
};

const assignSuggestion = (drivers: LogisticsDriver[], zone?: string | null) => {
  const candidate = pickBestDriver(drivers);
  if (!candidate) {
    return {
      suggestion: 'Aucun chauffeur disponible — libérer une mission ou activer un chauffeur',
      actionLabel: 'Voir chauffeurs',
      actionSection: 'drivers' as const,
    };
  }
  const name = candidate.user_name || candidate.user_email || 'chauffeur disponible';
  const zoneHint = zone ? ` · zone ${zone}` : '';
  return {
    suggestion: `→ Réassigner à ${name}${zoneHint}`,
    actionLabel: 'Ouvrir dispatch',
    actionSection: 'dispatch' as const,
    suggestedDriverId: candidate.id,
    suggestedDriverName: name,
  };
};

function premiumLabel(order: Order) {
  return isPremiumOrder(order)
    ? `Client premium · ${order.partner_name || 'montant élevé'}`
    : 'Collecte bloquée tant que paiement non résolu';
}

export type CapacitySummary = {
  available: number;
  active: number;
  open: number;
  expectedVolume2h: number;
  sufficient: boolean;
  headline: string;
  detail: string;
};

export function estimateExpectedVolume2h(
  fieldActivity: Array<{ hour: string; count: number }>,
  openCount: number,
  activeCount: number,
): number {
  const hourlyPeak = fieldActivity.length ? Math.max(...fieldActivity.map((bar) => bar.count)) : 0;
  const fromActivity = hourlyPeak > 0 ? hourlyPeak * 2 : 0;
  const fromQueue = openCount + activeCount;
  if (fromQueue > 0) return Math.max(fromQueue + 1, fromActivity);
  if (fromActivity > 0) return fromActivity;
  return 3;
}

export function buildCapacitySummary(
  availableDrivers: number,
  activeCount: number,
  openCount: number,
  fieldActivity: Array<{ hour: string; count: number }>,
): CapacitySummary {
  const expectedVolume2h = estimateExpectedVolume2h(fieldActivity, openCount, activeCount);
  const requiredDrivers = Math.max(1, Math.ceil(expectedVolume2h / 3));
  const sufficient = availableDrivers >= requiredDrivers && openCount === 0;

  if (availableDrivers === 0) {
    return {
      available: availableDrivers,
      active: activeCount,
      open: openCount,
      expectedVolume2h,
      sufficient: false,
      headline: 'Capacité critique · aucun chauffeur disponible',
      detail: `Volume attendu ~${expectedVolume2h} missions sur 2 h`,
    };
  }

  if (availableDrivers < requiredDrivers) {
    return {
      available: availableDrivers,
      active: activeCount,
      open: openCount,
      expectedVolume2h,
      sufficient: false,
      headline: `Capacité faible · ${availableDrivers} chauffeur(s) disponible(s)`,
      detail: `Volume moyen attendu : ${expectedVolume2h} missions (2 h)`,
    };
  }

  return {
    available: availableDrivers,
    active: activeCount,
    open: openCount,
    expectedVolume2h,
    sufficient: true,
    headline: `Capacité suffisante · ${availableDrivers} chauffeur(s) disponible(s)`,
    detail: `Couverture estimée pour les 2 prochaines heures (~${expectedVolume2h} missions)`,
  };
}

function buildCapacityDecision(summary: CapacitySummary): OperationalDecision | null {
  if (summary.sufficient) return null;

  const priority: DecisionPriority =
    summary.available === 0 ? 'critical' : summary.open > 0 ? 'high' : 'high';

  return {
    id: 'capacity-network',
    kind: 'capacity',
    priority,
    reference: 'Capacité réseau',
    observation: summary.headline,
    impact: summary.detail,
    suggestion:
      summary.available === 0
        ? '→ Activer un chauffeur ou libérer une mission en cours'
        : '→ Prévoir renfort ou limiter les nouvelles assignations',
    actionLabel: 'Gérer chauffeurs',
    actionSection: 'drivers',
    sortScore: PRIORITY_SCORE[priority] + 80,
  };
}

export function buildOperationalDecisions(
  tasks: LogisticsTask[],
  drivers: LogisticsDriver[],
  orders: Order[],
  tickets: AdminSupportTicket[],
  context: {
    openCount: number;
    activeCount: number;
    fieldActivity: Array<{ hour: string; count: number }>;
  },
): OperationalDecision[] {
  const decisions: OperationalDecision[] = [];
  const orderById = new Map(orders.map((order) => [order.id, order]));

  for (const task of tasks) {
    if (statusIn(task.status, ['completed', 'cancelled'])) continue;

    const ref = missionRef(task);
    const zone = task.pickup_commune || task.delivery_commune || 'zone inconnue';
    const order = orderById.get(task.order_id);
    const premium = isPremiumOrder(order);
    const assign = assignSuggestion(drivers, zone);

    if (statusIn(task.status, ['failed', 'expired'])) {
      const ago = minutesAgoLabel(task.updated_at || task.created_at) || 'récemment';
      decisions.push({
        id: `failed-${task.id}`,
        priority: 'critical',
        missionId: task.id,
        reference: ref,
        observation: `Mission ${ref} en échec ${ago}`,
        impact: premium
          ? `Client premium · ${order?.partner_name || 'partenaire prioritaire'}`
          : `Livraison bloquée · ${zone}`,
        suggestion: assign.suggestion,
        actionLabel: assign.actionLabel,
        actionSection: assign.actionSection,
        suggestedDriverId: assign.suggestedDriverId,
        suggestedDriverName: assign.suggestedDriverName,
        sortScore: PRIORITY_SCORE.critical + (premium ? 40 : 0),
      });
      continue;
    }

    const waitMinutes = ageMinutes(task.created_at);
    const estimatedDelay = Math.max(0, waitMinutes - DELAY_THRESHOLD_MIN);

    if (
      statusIn(task.status, ['pending', 'open_market']) &&
      !task.driver_id &&
      waitMinutes >= PENDING_ASSIGN_THRESHOLD_MIN
    ) {
      decisions.push({
        id: `unassigned-${task.id}`,
        priority: waitMinutes >= 30 ? 'critical' : 'high',
        missionId: task.id,
        reference: ref,
        observation: `Mission ${ref} sans chauffeur depuis ${waitMinutes} min`,
        impact: premium ? 'Client premium · risque SLA' : `${zone} · file dispatch`,
        suggestion: assign.suggestion,
        actionLabel: assign.actionLabel,
        actionSection: assign.actionSection,
        suggestedDriverId: assign.suggestedDriverId,
        suggestedDriverName: assign.suggestedDriverName,
        delayMinutes: estimatedDelay,
        sortScore: PRIORITY_SCORE.high + waitMinutes + (premium ? 30 : 0),
      });
      continue;
    }

    if (waitMinutes >= DELAY_THRESHOLD_MIN && !statusIn(task.status, ['completed', 'cancelled'])) {
      decisions.push({
        id: `delay-${task.id}`,
        priority: estimatedDelay >= 20 ? 'critical' : 'high',
        missionId: task.id,
        reference: ref,
        observation: `Mission ${ref} en retard · attente ${waitMinutes} min`,
        impact: premium
          ? `Retard estimé ${estimatedDelay} min · client premium`
          : `Retard estimé ${estimatedDelay} min · ${zone}`,
        suggestion:
          task.driver_id && !drivers.find((d) => d.id === task.driver_id)?.is_available
            ? assign.suggestion
            : `→ Relancer le chauffeur assigné ou ${assign.suggestion.replace('→ ', '')}`,
        actionLabel: 'Traiter la mission',
        actionSection: 'dispatch',
        suggestedDriverId: assign.suggestedDriverId,
        suggestedDriverName: assign.suggestedDriverName,
        delayMinutes: estimatedDelay,
        sortScore: PRIORITY_SCORE.high + estimatedDelay + (premium ? 25 : 0),
      });
    }

    if (task.status === 'in_progress' && task.started_at) {
      const activeMinutes = ageMinutes(task.started_at);
      if (activeMinutes >= 45) {
        decisions.push({
          id: `stale-${task.id}`,
          priority: 'medium',
          missionId: task.id,
          reference: ref,
          observation: `Mission ${ref} en cours depuis ${activeMinutes} min`,
          impact: `Dépassement probable · ${zone}`,
          suggestion: `→ Vérifier position et confirmer ETA client`,
          actionLabel: 'Suivre mission',
          actionSection: 'dispatch',
          delayMinutes: Math.max(0, activeMinutes - 45),
          sortScore: PRIORITY_SCORE.medium + activeMinutes,
        });
      }
    }
  }

  for (const order of orders) {
    if (!statusIn(order.payment_status, ['failed', 'declined', 'rejected', 'error'])) continue;
    const linked = tasks.find(
      (task) =>
        task.order_id === order.id &&
        !statusIn(task.status, ['completed', 'cancelled']) &&
        statusIn(task.status, ['pending', 'open_market', 'claimed']),
    );
    if (!linked) continue;
    decisions.push({
      id: `payment-${order.id}`,
      priority: 'high',
      missionId: linked.id,
      reference: order.order_number || missionRef(linked),
      observation: `Paiement échoué sur ${order.order_number || linked.id}`,
      impact: premiumLabel(order),
      suggestion: '→ Contacter client et relancer le paiement avant dispatch',
      actionLabel: 'Voir mission',
      actionSection: 'dispatch',
      sortScore: PRIORITY_SCORE.high + 15,
    });
  }

  for (const ticket of tickets) {
    if (statusIn(ticket.status, ['closed', 'resolved'])) continue;
    if (!statusIn(ticket.priority, ['high', 'urgent', 'critical'])) continue;
    const ago = minutesAgoLabel(ticket.created_at) || 'récemment';
    decisions.push({
      id: `ticket-${ticket.id}`,
      kind: 'mission',
      priority: statusIn(ticket.priority, ['urgent', 'critical']) ? 'high' : 'medium',
      reference: ticket.title,
      observation: `Ticket support ouvert ${ago}`,
      impact: `${ticket.priority.toUpperCase()} · ${ticket.category || 'support'}`,
      suggestion: '→ Traiter le ticket avant escalade client',
      actionLabel: 'Voir tickets',
      actionSection: 'alerts',
      sortScore: PRIORITY_SCORE.medium + ageMinutes(ticket.created_at),
    });
  }

  const availableDrivers = drivers.filter((driver) => driver.status === 'active' && driver.is_available).length;
  const capacitySummary = buildCapacitySummary(
    availableDrivers,
    context.activeCount,
    context.openCount,
    context.fieldActivity,
  );
  const capacityDecision = buildCapacityDecision(capacitySummary);
  if (capacityDecision) decisions.push(capacityDecision);

  const seen = new Set<string>();
  return decisions
    .sort((a, b) => b.sortScore - a.sortScore)
    .filter((decision) => {
      const key = decision.missionId || decision.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}
