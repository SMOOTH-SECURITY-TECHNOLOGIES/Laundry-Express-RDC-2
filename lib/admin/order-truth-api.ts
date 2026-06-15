import { realApi } from '../../services/real-api';
import {
  OrderTruthPeriod,
  OrderTruthSearchType,
  OrderTruthSummary,
} from './order-truth-types';
import { calculateTruthScore } from './order-truth-score';

const proofThumbs = {
  pickup: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=480&q=80',
  delivery: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=480&q=80',
  receipt: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=480&q=80',
  invoice: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=480&q=80',
  gps: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=480&q=80',
  logs: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=480&q=80',
};

export const fallbackOrderTruth: OrderTruthSummary = {
  order: {
    orderId: 'ORD-17807584',
    uuid: 'c0f2b7e2-2e6a-4baf-9c26-2f8a1807584',
    date: '11/05/2026 10:12',
    client: 'Marie Kabongo',
    phone: '+243 81 234 56 78',
    email: 'marie.kabongo@email.cd',
    address: 'Av. De la Paix, Gombe, Kinshasa, RDC',
    partner: 'Prestige Pressing',
    driver: 'Koffi A.',
    amount: '27.00 $',
    transaction: 'MP240511-84',
    finalStatus: 'Livree',
  },
  statusLabel: 'Commande complete',
  truthScore: 98,
  stats: {
    totalOrders: '12 584',
    tracedOrders: '98.2%',
    anomaliesDetected: '18',
    openInvestigations: '5',
    averageResolutionTime: '42 min',
  },
  events: [
    {
      id: 'EVT-1001',
      eventType: 'Commande',
      technicalName: 'order.created',
      title: 'Commande creee',
      description: 'Client : Marie Kabongo | Canal : Mobile App Android | IP : 102.15.32.11',
      occurredAt: '2026-05-11T10:12:34',
      actorName: 'Marie Kabongo',
      actorType: 'customer',
      source: 'Mobile App',
      reference: 'EVT-1001',
      status: 'success',
    },
    {
      id: 'EVT-1002',
      eventType: 'Paiement',
      technicalName: 'payment.received',
      title: 'Paiement recu',
      description: 'Montant : 27.00 $ | Methode : Mobile Money | Transaction : MP240511-84 | Statut : Succes',
      occurredAt: '2026-05-11T10:14:22',
      actorName: 'Orange Money',
      actorType: 'system',
      source: 'Payment Gateway',
      reference: 'EVT-1002',
      status: 'success',
      evidenceIds: ['proof-payment'],
    },
    {
      id: 'EVT-1003',
      eventType: 'Partenaire',
      technicalName: 'partner.confirmed',
      title: 'Partenaire confirme',
      description: 'Partenaire : Prestige Pressing | Localisation : Gombe | Estimation : 2h30 | Statut : Acceptee',
      occurredAt: '2026-05-11T10:16:48',
      actorName: 'Prestige Pressing',
      actorType: 'partner',
      source: 'Partner Portal',
      reference: 'EVT-1003',
      status: 'success',
    },
    {
      id: 'EVT-1004',
      eventType: 'Dispatch',
      technicalName: 'driver.assigned',
      title: 'Chauffeur assigne',
      description: 'Chauffeur : Koffi A. | Vehicule : Moto KN-25-AB | Distance : 1.2 km | ETA : 10:45',
      occurredAt: '2026-05-11T10:22:15',
      actorName: 'Dispatcher',
      actorType: 'admin',
      source: 'Dispatcher',
      reference: 'EVT-1004',
      status: 'success',
    },
    {
      id: 'EVT-1005',
      eventType: 'Collecte',
      technicalName: 'pickup.completed',
      title: 'Collecte effectuee',
      description: 'Chauffeur : Koffi A. | Client : Marie Kabongo | GPS : -4.3232, 15.3121',
      occurredAt: '2026-05-11T10:45:02',
      actorName: 'Koffi A.',
      actorType: 'driver',
      source: 'Driver App',
      reference: 'EVT-1005',
      status: 'success',
      thumbnailUrl: proofThumbs.pickup,
      evidenceIds: ['proof-pickup', 'proof-gps'],
    },
    {
      id: 'EVT-1006',
      eventType: 'Traitement',
      technicalName: 'cleaning.started',
      title: 'Nettoyage demarre',
      description: 'Partenaire : Prestige Pressing | Statut : En cours',
      occurredAt: '2026-05-11T11:20:10',
      actorName: 'Prestige Pressing',
      actorType: 'partner',
      source: 'Partner Portal',
      reference: 'EVT-1006',
      status: 'pending',
    },
    {
      id: 'EVT-1007',
      eventType: 'Qualite',
      technicalName: 'quality.checked',
      title: 'Controle qualite',
      description: 'Partenaire : Prestige Pressing | Statut : Valide',
      occurredAt: '2026-05-11T13:10:35',
      actorName: 'Prestige Pressing',
      actorType: 'partner',
      source: 'Partner Portal',
      reference: 'EVT-1007',
      status: 'success',
      thumbnailUrl: proofThumbs.invoice,
      evidenceIds: ['proof-invoice'],
    },
    {
      id: 'EVT-1008',
      eventType: 'Livraison',
      technicalName: 'delivery.completed',
      title: 'Livraison effectuee',
      description: 'Chauffeur : Koffi A. | Client : Marie Kabongo | GPS : -4.3231, 15.3124',
      occurredAt: '2026-05-11T15:05:18',
      actorName: 'Koffi A.',
      actorType: 'driver',
      source: 'Driver App',
      reference: 'EVT-1008',
      status: 'success',
      thumbnailUrl: proofThumbs.delivery,
      evidenceIds: ['proof-delivery'],
    },
  ],
  proofs: [
    { id: 'proof-pickup', type: 'photo', title: 'Photo collecte', timestamp: '2026-05-11T10:45:02', source: 'Driver App', thumbnailUrl: proofThumbs.pickup, hash: 'sha256:8f2c...', metadata: { Chauffeur: 'Koffi A.', GPS: '-4.3232, 15.3121' } },
    { id: 'proof-delivery', type: 'photo', title: 'Photo livraison', timestamp: '2026-05-11T15:05:18', source: 'Driver App', thumbnailUrl: proofThumbs.delivery, hash: 'sha256:19ab...', metadata: { Client: 'Marie Kabongo', GPS: '-4.3231, 15.3124' } },
    { id: 'proof-payment', type: 'payment', title: 'Recu paiement', timestamp: '2026-05-11T10:14:22', source: 'Orange Money', thumbnailUrl: proofThumbs.receipt, hash: 'sha256:cc42...', metadata: { Transaction: 'MP240511-84', Montant: '27.00 $' } },
    { id: 'proof-invoice', type: 'document', title: 'Facture', timestamp: '2026-05-11T13:10:35', source: 'System', thumbnailUrl: proofThumbs.invoice, metadata: { Facture: 'INV-17807584' } },
    { id: 'proof-gps', type: 'gps', title: 'GPS tracking', timestamp: '2026-05-11T15:05:18', source: 'Driver App', thumbnailUrl: proofThumbs.gps, metadata: { Distance: '4.2 km', Precision: '8 m' } },
    { id: 'proof-logs', type: 'logs', title: 'Logs systeme', timestamp: '2026-05-11T15:05:19', source: 'API Gateway', thumbnailUrl: proofThumbs.logs, metadata: { Correlation: 'corr-17807584' } },
  ],
  anomalies: [
    { id: 'ANO-001', title: 'Chauffeur hors zone', level: 'Critique', description: 'Position detectee hors corridor pendant 6 minutes.', source: 'GPS Monitor', recommendation: 'Verifier le trajet et contacter le chauffeur.' },
    { id: 'ANO-002', title: 'Temps de traitement eleve', level: 'Majeur', description: 'Traitement partenaire superieur a la moyenne Gombe.', source: 'SLA Engine', recommendation: 'Analyser la charge partenaire et ajuster les SLA.' },
  ],
  investigations: [
    { id: 'NOTE-1', author: 'Jean Admin', note: 'Client satisfait. Livraison effectuee en 2h55.', status: 'Interne', createdAt: '2026-05-11T16:20:00', visibility: 'Interne' },
    { id: 'INV-2026-238', status: 'En cours', priority: 'Majeure', assignedTo: 'Support Ops', createdAt: '2026-05-11T16:10:00' },
  ],
  relationNodes: [
    { id: 'client', label: 'Client', value: 'Marie Kabongo', detail: 'Gombe', icon: 'user', status: 'success' },
    { id: 'order', label: 'Commande', value: 'ORD-17807584', detail: 'Creee', icon: 'shoppingBag', status: 'success' },
    { id: 'payment', label: 'Paiement', value: '27.00 $', detail: 'Verifie', icon: 'currencyDollar', status: 'success' },
    { id: 'partner', label: 'Partenaire', value: 'Prestige Pressing', detail: 'Confirme', icon: 'building', status: 'success' },
    { id: 'driver', label: 'Chauffeur', value: 'Koffi A.', detail: 'Assigne', icon: 'truck', status: 'success' },
    { id: 'delivery', label: 'Livraison', value: 'Completee', detail: 'Livree', icon: 'check', status: 'success' },
  ],
  technicalLogs: [
    { time: '10:12:34', name: 'order.created', reference: 'EVT-1001' },
    { time: '10:14:22', name: 'payment.received', reference: 'EVT-1002' },
    { time: '10:15:01', name: 'partner.notified', reference: 'EVT-1003' },
    { time: '10:22:15', name: 'driver.assigned', reference: 'EVT-1004' },
    { time: '10:45:02', name: 'pickup.completed', reference: 'EVT-1005' },
    { time: '11:20:10', name: 'cleaning.started', reference: 'EVT-1006' },
    { time: '13:10:35', name: 'quality.checked', reference: 'EVT-1007' },
    { time: '15:05:18', name: 'delivery.completed', reference: 'EVT-1008' },
  ],
};

export async function searchOrderTruth(
  query: string,
  searchType: OrderTruthSearchType,
  period: OrderTruthPeriod
): Promise<OrderTruthSummary | null> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  try {
    if (searchType === 'order_id' || searchType === 'uuid') {
      const response = await realApi.getOrderTruthTimeline(query.trim());
      const events = response.events.map((event, index) => ({
        id: String(event.id),
        eventType: String(event.event_type || 'Evenement'),
        technicalName: String(event.event_type || `event.${index + 1}`),
        title: String(event.event_type || 'Evenement systeme'),
        description: [event.from_status, event.to_status].filter(Boolean).join(' -> ') || 'Evenement operationnel enregistre.',
        occurredAt: String(event.occurred_at),
        actorName: 'Systeme',
        actorType: 'system' as const,
        source: String(event.source || 'system'),
        reference: `EVT-${String(index + 1).padStart(4, '0')}`,
        status: event.event_subtype ? 'warning' as const : 'success' as const,
        metadata: Object.fromEntries(
          Object.entries(event.payload || {}).map(([key, value]) => [key, String(value)])
        ),
      }));
      const proofs = response.proofs.map((proof, index) => ({
        id: String(proof.id),
        type: String(proof.proof_type || 'proof'),
        title: String(proof.proof_type || `Preuve ${index + 1}`),
        timestamp: String(proof.recorded_at),
        source: String(proof.actor_type || 'system'),
        thumbnailUrl: Object.values(proofThumbs)[index % Object.values(proofThumbs).length],
        metadata: Object.fromEntries(
          Object.entries(proof.proof_data || {}).map(([key, value]) => [key, String(value)])
        ),
      }));
      const mapped: OrderTruthSummary = {
        ...fallbackOrderTruth,
        order: {
          ...fallbackOrderTruth.order,
          orderId: response.order_number || query.trim(),
          uuid: response.order_id,
          finalStatus: response.current_status || fallbackOrderTruth.order.finalStatus,
        },
        events,
        proofs,
        anomalies: [],
        statusLabel: 'Commande tracee',
      };
      return { ...mapped, truthScore: calculateTruthScore(mapped.events, mapped.proofs, mapped.anomalies) };
    }
  } catch {
    // Fall through to replaceable fallback for local demos and incomplete backend coverage.
  }

  const matchValues = [
    fallbackOrderTruth.order.orderId,
    fallbackOrderTruth.order.uuid,
    fallbackOrderTruth.order.client,
    fallbackOrderTruth.order.phone,
    fallbackOrderTruth.order.partner,
    fallbackOrderTruth.order.driver,
    fallbackOrderTruth.order.transaction,
  ].map((value) => value.toLowerCase());

  if (matchValues.some((value) => value.includes(normalized)) || period === 'all') {
    return {
      ...fallbackOrderTruth,
      truthScore: fallbackOrderTruth.truthScore ?? calculateTruthScore(
        fallbackOrderTruth.events,
        fallbackOrderTruth.proofs,
        fallbackOrderTruth.anomalies
      ),
    };
  }

  return null;
}
