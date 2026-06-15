import type {
  SubscriptionPlan,
  SubscriptionKpis,
  PlanDistribution,
  RecurringRevenuePoint,
  PlanFeature,
  SubscriptionActivity,
  SubscribedPartner,
  InvoiceKpis,
  ChurnMetrics,
  AuditItem,
} from './subscriptions-types';

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'plan-essential',
    name: 'Essentiel',
    tier: 'essential',
    price: 29,
    interval: 'mois',
    description: 'Pour les petits partenaires qui démarrent',
    features: [
      'Gestion de commandes basique',
      'Tableau de bord simple',
      'Support par email',
      '1 compte utilisateur',
      'Rapports mensuels',
    ],
    disabledFeatures: [
      'API intégration',
      'Multi-entrepôts',
      'Support prioritaire',
    ],
    partnerCount: 58,
  },
  {
    id: 'plan-professional',
    name: 'Professionnel',
    tier: 'professional',
    price: 79,
    interval: 'mois',
    description: 'Pour les partenaires en croissance',
    badge: 'Populaire',
    features: [
      'Gestion de commandes avancée',
      'Tableau de bord complet',
      'Support prioritaire',
      '5 comptes utilisateurs',
      'Rapports hebdomadaires',
      'API intégration',
      'Multi-entrepôts',
    ],
    disabledFeatures: ['White-label', 'Manager dédié'],
    partnerCount: 48,
  },
  {
    id: 'plan-enterprise',
    name: 'Entreprise',
    tier: 'enterprise',
    price: 199,
    interval: 'mois',
    description: 'Pour les grandes opérations',
    features: [
      'Gestion de commandes illimitée',
      'Tableau de bord premium',
      'Support 24/7',
      'Comptes utilisateurs illimités',
      'Rapports en temps réel',
      'API intégration avancée',
      'Multi-entrepôts',
      'White-label',
      'Manager dédié',
    ],
    disabledFeatures: [],
    partnerCount: 22,
  },
];

export const subscriptionKpis: SubscriptionKpis = {
  activePlans: 3,
  subscribedPartners: 128,
  mrr: 22450,
  arr: 269400,
  conversionRate: 63,
  churnRate: 2.1,
};

export const planDistribution: PlanDistribution[] = [
  { name: 'Essentiel', count: 58, percentage: 45.3, color: '#3b82f6' },
  { name: 'Professionnel', count: 48, percentage: 37.5, color: '#8b5cf6' },
  { name: 'Entreprise', count: 22, percentage: 17.2, color: '#f59e0b' },
];

export const recurringRevenue: RecurringRevenuePoint[] = [
  { month: 'Jan', mrr: 18200 },
  { month: 'Fév', mrr: 18900 },
  { month: 'Mar', mrr: 19500 },
  { month: 'Avr', mrr: 20100 },
  { month: 'Mai', mrr: 20800 },
  { month: 'Jun', mrr: 21200 },
  { month: 'Jul', mrr: 21500 },
  { month: 'Aoû', mrr: 21800 },
  { month: 'Sep', mrr: 22000 },
  { month: 'Oct', mrr: 22100 },
  { month: 'Nov', mrr: 22300 },
  { month: 'Déc', mrr: 22450 },
];

export const planFeatures: PlanFeature[] = [
  { name: 'Gestion des commandes', icon: 'Package', essential: true, professional: true, enterprise: true },
  { name: 'Tableau de bord', icon: 'LayoutDashboard', essential: true, professional: true, enterprise: true },
  { name: 'Rapports', icon: 'FileText', essential: true, professional: true, enterprise: true },
  { name: 'Support', icon: 'Headphones', essential: true, professional: true, enterprise: true },
  { name: 'API intégration', icon: 'Plug', essential: false, professional: true, enterprise: true },
  { name: 'Multi-entrepôts', icon: 'Warehouse', essential: false, professional: true, enterprise: true },
  { name: 'Comptes utilisateurs', icon: 'Users', essential: false, professional: true, enterprise: true },
  { name: 'Rapports en temps réel', icon: 'Activity', essential: false, professional: false, enterprise: true },
  { name: 'White-label', icon: 'Palette', essential: false, professional: false, enterprise: true },
  { name: 'Manager dédié', icon: 'UserCheck', essential: false, professional: false, enterprise: true },
];

export const recentActivities: SubscriptionActivity[] = [
  {
    id: 'act-1',
    time: 'Il y a 12 min',
    user: 'LaundryMax',
    action: 'A upgrade vers Professionnel',
    detail: 'Passe de Essentiel à Professionnel',
    color: '#8b5cf6',
    icon: 'arrowRight',
  },
  {
    id: 'act-2',
    time: 'Il y a 1h',
    user: 'CleanPro Services',
    action: 'A renouvelé Entreprise',
    detail: 'Renouvellement automatique pour 12 mois',
    color: '#f59e0b',
    icon: 'arrow-path',
  },
  {
    id: 'act-3',
    time: 'Il y a 3h',
    user: 'FreshPress',
    action: 'A souscrit à Essentiel',
    detail: 'Nouveau partenaire sur le plan Essentiel',
    color: '#3b82f6',
    icon: 'plus',
  },
  {
    id: 'act-4',
    time: 'Il y a 5h',
    user: 'SparkleWash',
    action: 'Paiement en retard',
    detail: 'Facture #INV-2024-089 - 7 jours de retard',
    color: '#ef4444',
    icon: 'warning',
  },
];

export const subscribedPartners: SubscribedPartner[] = [
  { id: 'p-1', name: 'LaundryMax', plan: 'Professionnel', startDate: '2024-03-15', renewalDate: '2025-03-15', mrr: 79, status: 'active' },
  { id: 'p-2', name: 'CleanPro Services', plan: 'Entreprise', startDate: '2023-11-01', renewalDate: '2025-11-01', mrr: 199, status: 'active' },
  { id: 'p-3', name: 'FreshPress', plan: 'Essentiel', startDate: '2024-06-20', renewalDate: '2025-06-20', mrr: 29, status: 'active' },
  { id: 'p-4', name: 'SparkleWash', plan: 'Professionnel', startDate: '2024-01-10', renewalDate: '2025-01-10', mrr: 79, status: 'overdue' },
  { id: 'p-5', name: 'EcoLaundry', plan: 'Essentiel', startDate: '2024-04-05', renewalDate: '2025-04-05', mrr: 29, status: 'active' },
  { id: 'p-6', name: 'QuickClean Hub', plan: 'Entreprise', startDate: '2023-09-15', renewalDate: '2025-09-15', mrr: 199, status: 'active' },
  { id: 'p-7', name: 'ProTowel', plan: 'Essentiel', startDate: '2024-07-01', renewalDate: '2025-07-01', mrr: 29, status: 'trial' },
  { id: 'p-8', name: 'SpinCycle Co', plan: 'Professionnel', startDate: '2024-02-28', renewalDate: '2025-02-28', mrr: 79, status: 'suspended' },
];

export const invoiceKpis: InvoiceKpis = {
  issued: 245,
  paid: 198,
  overdue: 12,
  collected: 18240,
};

export const churnMetrics: ChurnMetrics = {
  newSubscribers: 18,
  cancellations: 3,
  trialConversion: 63,
  retention30: 92,
  retention90: 85,
};

export const auditItems: AuditItem[] = [
  { label: 'Abonnements actifs', value: 128, status: 'healthy', icon: 'check' },
  { label: 'Facturation cohérente', value: 125, status: 'healthy', icon: 'check' },
  { label: 'Paiements manquants', value: 3, status: 'warning', icon: 'warning' },
  { label: 'Anomalies détectées', value: 2, status: 'critical', icon: 'exclamation-circle' },
];
