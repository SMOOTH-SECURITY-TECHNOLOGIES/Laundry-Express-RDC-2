import { OrderAnomaly, OrderProof, OrderTruthEvent } from './order-truth-types';

export function calculateTruthScore(
  events: OrderTruthEvent[],
  proofs: OrderProof[],
  anomalies: OrderAnomaly[]
): number {
  const requiredEvents = [
    'order.created',
    'payment.received',
    'partner.confirmed',
    'driver.assigned',
    'pickup.completed',
    'cleaning.started',
    'quality.checked',
    'delivery.completed',
  ];
  const requiredProofs = ['Photo collecte', 'Photo livraison', 'Recu paiement', 'GPS tracking'];

  const eventCoverage =
    requiredEvents.filter((name) => events.some((event) => event.technicalName === name)).length /
    requiredEvents.length;
  const proofCoverage =
    requiredProofs.filter((name) => proofs.some((proof) => proof.title === name)).length /
    requiredProofs.length;
  const failedEvents = events.filter((event) => event.status === 'error' || event.status === 'missing').length;
  const anomalyPenalty = anomalies.reduce((total, anomaly) => {
    if (anomaly.level === 'Critique') return total + 8;
    if (anomaly.level === 'Majeur') return total + 4;
    return total + 2;
  }, 0);

  const score = Math.round(eventCoverage * 60 + proofCoverage * 35 + 5 - failedEvents * 5 - anomalyPenalty);
  return Math.max(0, Math.min(100, score));
}
