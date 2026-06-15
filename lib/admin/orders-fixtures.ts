import {
  OrderKpis,
  PipelineStep,
  LiveOrder,
  OrderSlaData,
  OrderFunnelStep,
  OrderRevenueData,
  OrderRevenueBlock,
  OrderAnomaly,
  OrderPartner,
  OrderInvoiceKpis,
  OrderActivity,
  OrderMapZone,
} from './orders-types';

export const orderKpis: OrderKpis = {
  total: 1254,
  active: 84,
  inPickup: 32,
  inCleaning: 26,
  inDelivery: 18,
  disputes: 4,
  slaGlobal: 96,
  revenueToday: 2450,
};

export const orderPipeline: PipelineStep[] = [
  { label: 'Créée', count: 46, icon: 'create', color: '#6B7280' },
  { label: 'Confirmée', count: 38, icon: 'check_circle', color: '#3B82F6' },
  { label: 'Collecte assignée', count: 32, icon: 'local_shipping', color: '#8B5CF6' },
  { label: 'Collectée', count: 32, icon: 'inventory_2', color: '#F59E0B' },
  { label: 'Nettoyage', count: 26, icon: 'cleaning_services', color: '#10B981' },
  { label: 'Qualité', count: 12, icon: 'verified', color: '#06B6D4' },
  { label: 'Livraison assignée', count: 18, icon: 'delivery_dining', color: '#F97316' },
  { label: 'Livrée', count: 8, icon: 'done_all', color: '#22C55E' },
  { label: 'Terminée', count: 1042, icon: 'emoji_events', color: '#14B8A6' },
];

export const liveOrders: LiveOrder[] = [
  {
    id: 'ORD-12451',
    clientName: 'Marie Dupont',
    clientPhone: '+241 06 12 34 56',
    partnerName: 'Pressing Bonanjo',
    partnerCommune: 'Bonanjo',
    driverName: 'Paul Mbarga',
    driverPhone: '+241 07 89 01 23',
    status: 'Livraison assignée',
    statusColor: 'bg-orange-100 text-orange-700',
    amount: 4500,
    paymentMethod: 'Mobile Money',
    paymentStatus: 'Payé',
    eta: '25 min',
    sla: 85,
    slaColor: 'text-green-600',
    commune: 'Akwa',
  },
  {
    id: 'ORD-12452',
    clientName: 'Jean-Pierre Nkodo',
    clientPhone: '+241 06 23 45 67',
    partnerName: 'Clean Express',
    partnerCommune: 'Bastos',
    driverName: 'Claire Eboa',
    driverPhone: '+241 07 90 12 34',
    status: 'Nettoyage',
    statusColor: 'bg-green-100 text-green-700',
    amount: 6200,
    paymentMethod: 'Carte bancaire',
    paymentStatus: 'Payé',
    eta: '45 min',
    sla: 72,
    slaColor: 'text-amber-600',
    commune: 'Bastos',
  },
  {
    id: 'ORD-12453',
    clientName: 'Sandrine Bella',
    clientPhone: '+241 06 34 56 78',
    partnerName: 'Laverie Smart',
    partnerCommune: 'Makepe',
    driverName: 'En attente',
    driverPhone: '',
    status: 'Collecte assignée',
    statusColor: 'bg-violet-100 text-violet-700',
    amount: 3800,
    paymentMethod: 'Cash',
    paymentStatus: 'En attente',
    eta: '60 min',
    sla: 45,
    slaColor: 'text-red-600',
    commune: 'Makepe',
  },
  {
    id: 'ORD-12454',
    clientName: 'Olivier Fouda',
    clientPhone: '+241 06 45 67 89',
    partnerName: 'Pressing Bonanjo',
    partnerCommune: 'Bonanjo',
    driverName: 'Marc Ndjock',
    driverPhone: '+241 07 01 23 45',
    status: 'Confirmée',
    statusColor: 'bg-blue-100 text-blue-700',
    amount: 2700,
    paymentMethod: 'Mobile Money',
    paymentStatus: 'Payé',
    eta: '90 min',
    sla: 90,
    slaColor: 'text-green-600',
    commune: 'Bonapriso',
  },
  {
    id: 'ORD-12455',
    clientName: 'Aimée Messi',
    clientPhone: '+241 06 56 78 90',
    partnerName: 'Clean Express',
    partnerCommune: 'Bastos',
    driverName: 'En attente',
    driverPhone: '',
    status: 'Créée',
    statusColor: 'bg-gray-100 text-gray-700',
    amount: 5100,
    paymentMethod: 'Mobile Money',
    paymentStatus: 'En attente',
    eta: '120 min',
    sla: 30,
    slaColor: 'text-red-600',
    commune: 'Bastos',
  },
];

export const orderSlaData: OrderSlaData = {
  inSla: 94,
  atRisk: 5,
  outOfSla: 1,
  inSlaPercent: 94,
  atRiskPercent: 5,
  outOfSlaPercent: 1,
};

export const orderFunnel: OrderFunnelStep[] = [
  { label: 'Créées', value: 1254, percentage: 100, color: '#6B7280' },
  { label: 'Confirmées', value: 1198, percentage: 95.5, color: '#3B82F6' },
  { label: 'Collectées', value: 1120, percentage: 89.3, color: '#8B5CF6' },
  { label: 'En nettoyage', value: 1086, percentage: 86.6, color: '#10B981' },
  { label: 'Livrées', value: 1050, percentage: 83.7, color: '#22C55E' },
  { label: 'Terminées', value: 1042, percentage: 83.1, color: '#14B8A6' },
];

export const orderRevenueData: OrderRevenueData = {
  mrr: 72500,
  mrrChange: 8.2,
  monthly: [
    { month: 'Jan', value: 58000 },
    { month: 'Fév', value: 61200 },
    { month: 'Mar', value: 59800 },
    { month: 'Avr', value: 64500 },
    { month: 'Mai', value: 63100 },
    { month: 'Jun', value: 67200 },
    { month: 'Jul', value: 65800 },
    { month: 'Aoû', value: 69400 },
    { month: 'Sep', value: 68100 },
    { month: 'Oct', value: 70500 },
    { month: 'Nov', value: 71200 },
    { month: 'Déc', value: 72500 },
  ],
};

export const orderRevenueBlock: OrderRevenueBlock = {
  grossRevenue: 2450,
  commissions: -292,
  refunds: -58,
  net: 2100,
};

export const orderAnomalies: OrderAnomaly[] = [
  { id: 'ANM-1', title: 'Retard collecte > 30min', count: 8, icon: 'schedule', color: '#EF4444' },
  { id: 'ANM-2', title: 'Litige ouvert > 24h', count: 4, icon: 'gavel', color: '#F97316' },
  { id: 'ANM-3', title: 'Paiement échoué', count: 6, icon: 'payment', color: '#F59E0B' },
  { id: 'ANM-4', title: 'Partenaire inactif > 2h', count: 3, icon: 'block', color: '#8B5CF6' },
  { id: 'ANM-5', title: 'SLA livraison dépassé', count: 5, icon: 'local_shipping', color: '#EF4444' },
];

export const orderPartners: OrderPartner[] = [
  { name: 'Pressing Bonanjo', activeOrders: 18, sla: 97, deliveriesInProgress: 5, rating: 4.8 },
  { name: 'Clean Express', activeOrders: 22, sla: 94, deliveriesInProgress: 7, rating: 4.6 },
  { name: 'Laverie Smart', activeOrders: 15, sla: 91, deliveriesInProgress: 3, rating: 4.3 },
  { name: 'Pressing Premium', activeOrders: 12, sla: 98, deliveriesInProgress: 2, rating: 4.9 },
  { name: 'Eco Clean', activeOrders: 17, sla: 89, deliveriesInProgress: 4, rating: 4.1 },
];

export const orderInvoiceKpis: OrderInvoiceKpis = {
  issued: 48,
  paid: 36,
  overdue: 8,
  collected: 172800,
};

export const orderActivity: OrderActivity[] = [
  { id: 'ACT-1', time: 'Il y a 5 min', action: 'Commande confirmée', detail: 'ORD-12454 par Pressing Bonanjo', icon: 'check_circle', color: '#22C55E' },
  { id: 'ACT-2', time: 'Il y a 12 min', action: 'Litige ouvert', detail: 'ORD-12430 -vêtement endommagé', icon: 'gavel', color: '#EF4444' },
  { id: 'ACT-3', time: 'Il y a 18 min', action: 'Livraison effectuée', detail: 'ORD-12440 à Akwa', icon: 'done_all', color: '#22C55E' },
  { id: 'ACT-4', time: 'Il y a 25 min', action: 'Chauffeur assigné', detail: 'Paul Mbarga → ORD-12451', icon: 'person_add', color: '#3B82F6' },
  { id: 'ACT-5', time: 'Il y a 34 min', action: 'Paiement reçu', detail: 'ORD-12452 - 6200 FCFA Mobile Money', icon: 'payments', color: '#14B8A6' },
];

export const orderMapZones: OrderMapZone[] = [
  { name: 'Akwa', type: 'active', count: 24, color: '#22C55E', x: 180, y: 150 },
  { name: 'Bonanjo', type: 'active', count: 18, color: '#3B82F6', x: 145, y: 115 },
  { name: 'Bastos', type: 'active', count: 15, color: '#8B5CF6', x: 220, y: 100 },
  { name: 'Makepe', type: 'moderate', count: 12, color: '#F59E0B', x: 270, y: 85 },
  { name: 'Bonapriso', type: 'active', count: 10, color: '#10B981', x: 200, y: 175 },
  { name: 'Deido', type: 'low', count: 5, color: '#6B7280', x: 130, y: 75 },
];
