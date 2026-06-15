import type { InvestigationSummary, TruthEvent, RelationshipNode, RelationshipEdge, Evidence, Violation, FinancialImpact, RootCauseAnalysis, CorridorStatus } from './investigate-types';

export const MOCK_SUMMARY: InvestigationSummary = {
  entities: [
    { type: 'order', id: 'ORD-7841', label: 'Commande', status: 'Livrée', corridor: 'Marketplace', icon: 'shoppingBag' },
    { type: 'payment', id: 'PAY-224', label: 'Paiement', status: 'Capturé', corridor: 'Paiement', icon: 'currencyDollar' },
    { type: 'delivery', id: 'DRV-981', label: 'Livraison', status: 'Terminée', corridor: 'Logistique', icon: 'truck' },
    { type: 'partner', id: 'PAR-115', label: 'Partenaire', status: 'Actif', corridor: 'Marketplace', icon: 'building' },
    { type: 'client', id: 'USR-042', label: 'Client', status: 'Actif', corridor: 'Marketplace', icon: 'user' },
    { type: 'driver', id: 'DRV-DAVID-98', label: 'Chauffeur', status: 'Actif', corridor: 'Logistique', icon: 'truck' },
  ],
  confidence: 94,
  startDate: '2026-06-07T09:15:00Z',
  endDate: '2026-06-07T15:22:00Z',
  duration: '6h 07m',
  sourcePrincipal: 'Système',
  corridorsLies: 5,
  evenementsTrouves: 38,
};

export const MOCK_TIMELINE: TruthEvent[] = [
  { id: 'EVT-1', time: '09:15:32', date: '07/06/2026', title: 'Commande créée', corridor: 'Marketplace', actor: 'Marie Kabongo', proof: 'order_created', status: 'info' },
  { id: 'EVT-2', time: '09:16:08', date: '07/06/2026', title: 'Paiement initié', corridor: 'Paiement', actor: 'Système', proof: 'payment_intent_created', status: 'info' },
  { id: 'EVT-3', time: '09:16:41', date: '07/06/2026', title: 'Paiement capturé', corridor: 'Paiement', actor: 'Mobile Money', proof: 'provider_webhook', status: 'success' },
  { id: 'EVT-4', time: '09:20:12', date: '07/06/2026', title: 'Mission logistique créée', corridor: 'Logistique', actor: 'Système', proof: 'delivery_task_created', status: 'info' },
  { id: 'EVT-5', time: '09:24:33', date: '07/06/2026', title: 'Chauffeur assigné', corridor: 'Logistique', actor: 'Dispatcher', proof: 'driver_assigned', status: 'info' },
  { id: 'EVT-6', time: '09:46:58', date: '07/06/2026', title: 'Collecte effectuée', corridor: 'Logistique', actor: 'David M.', proof: 'pickup_confirmed', status: 'success' },
  { id: 'EVT-7', time: '12:11:24', date: '07/06/2026', title: 'Nettoyage terminé', corridor: 'Marketplace', actor: 'Prestige Pressing', proof: 'service_completed', status: 'success' },
  { id: 'EVT-8', time: '15:22:05', date: '07/06/2026', title: 'Livraison effectuée', corridor: 'Logistique', actor: 'David M.', proof: 'delivery_completed', status: 'success' },
];

export const MOCK_RELATIONSHIPS: { nodes: RelationshipNode[]; edges: RelationshipEdge[] } = {
  nodes: [
    { id: 'client', label: 'Marie Kabongo', type: 'Client', icon: 'user', color: '#3B82F6', x: 400, y: 50 },
    { id: 'order', label: 'ORD-7841', type: 'Commande', icon: 'shoppingBag', color: '#8B5CF6', x: 400, y: 150 },
    { id: 'payment', label: 'PAY-224', type: 'Paiement', icon: 'currencyDollar', color: '#22C55E', x: 250, y: 250 },
    { id: 'partner', label: 'Prestige Pressing', type: 'Partenaire', icon: 'building', color: '#F59E0B', x: 400, y: 300 },
    { id: 'delivery', label: 'DRV-981', type: 'Mission', icon: 'truck', color: '#EF4444', x: 550, y: 250 },
    { id: 'driver', label: 'David M.', type: 'Chauffeur', icon: 'truck', color: '#06B6D4', x: 550, y: 380 },
  ],
  edges: [
    { from: 'client', to: 'order', label: 'Créée', type: 'confirmed' },
    { from: 'order', to: 'payment', label: 'Payée', type: 'confirmed' },
    { from: 'order', to: 'partner', label: 'Assignée', type: 'confirmed' },
    { from: 'order', to: 'delivery', label: 'Mission', type: 'confirmed' },
    { from: 'delivery', to: 'driver', label: 'Assigné', type: 'confirmed' },
  ],
};

export const MOCK_EVIDENCE: Evidence[] = [
  { id: 'EV-1', category: 'photo', title: 'Photo collecte', description: 'Photo prise lors du ramassage', timestamp: '2026-06-07T09:46:58Z' },
  { id: 'EV-2', category: 'photo', title: 'Photo livraison', description: 'Photo de preuve de livraison', timestamp: '2026-06-07T15:22:05Z' },
  { id: 'EV-3', category: 'payment', title: 'Reçu paiement', description: 'Transaction Mobile Money PAY-224', timestamp: '2026-06-07T09:16:41Z' },
  { id: 'EV-4', category: 'document', title: 'Facture partenaire', description: 'Facture Prestige Pressing', timestamp: '2026-06-07T12:11:24Z' },
  { id: 'EV-5', category: 'log', title: 'Event logs', description: '38 événements enregistrés', timestamp: '2026-06-07T15:22:05Z' },
];

export const MOCK_VIOLATIONS: Violation[] = [
  { id: 'VIO-1', title: 'Paiement sans collecte', description: 'Paiement capturé avant confirmation collecte', severity: 'critical', impact: '25,00 $', detectedAt: '08:16', proof: 'provider_webhook' },
  { id: 'VIO-2', title: 'Livraison sans preuve photo', description: 'Photo de livraison manquante', severity: 'major', impact: 'Client', detectedAt: '15:22', proof: 'missing_evidence' },
  { id: 'VIO-3', title: 'Collecte hors zone assignée', description: 'Chauffeur sorti de sa zone', severity: 'medium', impact: 'SLA', detectedAt: '09:46', proof: 'gps_out_of_zone' },
];

export const MOCK_FINANCIAL: FinancialImpact = {
  clientPaid: 27,
  partnerAmount: 18,
  driverAmount: 4,
  platformCommission: 5,
  estimatedLoss: 12,
};

export const MOCK_ROOT_CAUSE: RootCauseAnalysis = {
  mainCause: 'Collecte confirmée avant affectation chauffeur',
  mainProbability: 89,
  description: 'workflow logistique dégradé',
  alternatives: [
    { cause: 'Webhook retardé', probability: 15, color: '#F59E0B' },
    { cause: 'Erreur partenaire', probability: 8, color: '#EF4444' },
    { cause: 'Erreur opérateur', probability: 4, color: '#6B7280' },
  ],
};

export const MOCK_CORRIDORS: CorridorStatus[] = [
  { name: 'Commande', status: 'healthy', icon: 'shoppingBag' },
  { name: 'Paiement', status: 'degraded', icon: 'currencyDollar' },
  { name: 'Logistique', status: 'critical', icon: 'truck' },
  { name: 'Marketplace', status: 'healthy', icon: 'building' },
  { name: 'Notifications', status: 'healthy', icon: 'bell' },
];
