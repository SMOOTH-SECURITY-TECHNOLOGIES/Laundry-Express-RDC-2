
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ControlCenterSidebar, controlCenterSections } from '../components/admin/ControlCenterSidebar';
import { ControlCenterHeader } from '../components/admin/ControlCenterHeader';
import { AlertBar } from '../components/admin/AlertBar';
import { KpiRow } from '../components/admin/KpiRow';
import { LiveOperations } from '../components/admin/LiveOperations';
import { KinshasaMap } from '../components/admin/KinshasaMap';
import { CockpitDispatcher } from '../components/admin/CockpitDispatcher';
import { SlaCenter } from '../components/admin/SlaCenter';
import { RevenueLeakage } from '../components/admin/RevenueLeakage';
import { PartnerHealthScore } from '../components/admin/PartnerHealthScore';
import { AnalyticsRow } from '../components/admin/AnalyticsRow';
import { TruthDashboard } from '../components/admin/TruthDashboard';
import { AnomaliesTable } from '../components/admin/AnomaliesTable';
import { ChauffeurPerformance } from '../components/admin/ChauffeurPerformance';
import { FinanceSummary } from '../components/admin/FinanceSummary';
import { SupportCenter } from '../components/admin/SupportCenter';
import { QuickActions } from '../components/admin/QuickActions';
import { TechFooter } from '../components/admin/TechFooter';
import { Icon } from '../components/Icon';

interface ModuleConfig {
  title: string;
  description: string;
  icon: string;
  metrics: { label: string; value: string; tone: string }[];
  queue: { item: string; owner: string; status: string; priority: string }[];
  actions: string[];
  connections: string[];
}

const moduleConfigs: Record<string, ModuleConfig> = {
  Investigate: {
    title: 'Investigations',
    description: 'Analysez les anomalies opérationnelles, assignez les responsabilités et documentez les résolutions.',
    icon: 'search',
    metrics: [
      { label: 'Cas ouverts', value: '6', tone: 'text-red-600 bg-red-50' },
      { label: 'SLA enquête', value: '2h', tone: 'text-orange-600 bg-orange-50' },
      { label: 'Résolus 7j', value: '18', tone: 'text-green-600 bg-green-50' },
    ],
    queue: [
      { item: 'ORD-1045 - paiement doublon', owner: 'Finance', status: 'Preuve requise', priority: 'Haute' },
      { item: 'MSN-7841 - retard SLA', owner: 'Dispatch', status: 'En analyse', priority: 'Critique' },
      { item: 'SUP-021 - remboursement', owner: 'Support', status: 'Client contacté', priority: 'Moyenne' },
    ],
    actions: ['Ouvrir dossier', 'Assigner enquêteur', 'Exporter preuves'],
    connections: ['Order Truth', 'Anomalies', 'Support', 'Revenue Leakage'],
  },
  Candidatures: {
    title: 'Candidatures partenaires',
    description: 'Qualifiez les pressings, blanchisseries, cordonniers et logisticiens avant publication marketplace.',
    icon: 'document-text',
    metrics: [
      { label: 'En attente', value: '5', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Dossiers complets', value: '3', tone: 'text-green-600 bg-green-50' },
      { label: 'À vérifier', value: '2', tone: 'text-orange-600 bg-orange-50' },
    ],
    queue: [
      { item: 'Kin Pressing Pro', owner: 'Marketplace', status: 'Contrat reçu', priority: 'Haute' },
      { item: 'Wash & Fold Gombe', owner: 'Qualité', status: 'Photos manquantes', priority: 'Moyenne' },
      { item: 'LogiMoto Express', owner: 'Logistique', status: 'Permis flotte', priority: 'Haute' },
    ],
    actions: ['Approuver dossier', 'Demander pièces', 'Planifier visite'],
    connections: ['Partenaires', 'Services', 'Zones', 'Abonnements'],
  },
  Services: {
    title: 'Gestion des services',
    description: 'Configurez les services vendus, unités de facturation, tarifs, options et règles par partenaire.',
    icon: 'list',
    metrics: [
      { label: 'Services actifs', value: '12', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Facturés au kilo', value: '4', tone: 'text-green-600 bg-green-50' },
      { label: 'Facturés article', value: '8', tone: 'text-purple-600 bg-purple-50' },
    ],
    queue: [
      { item: 'Lessive kilo - prix commune', owner: 'Pricing', status: 'À valider', priority: 'Haute' },
      { item: 'Nettoyage costume', owner: 'Marketplace', status: 'Publié', priority: 'Normale' },
      { item: 'Cordonnerie express', owner: 'Qualité', status: 'Test partenaire', priority: 'Moyenne' },
    ],
    actions: ['Créer service', 'Modifier tarifs', 'Associer partenaires'],
    connections: ['Order/service', 'Partenaires', 'Promotions', 'Analytics'],
  },
  Abonnements: {
    title: 'Abonnements partenaires',
    description: 'Suivez les plans partenaires, quotas, visibilité sponsorisée et statuts de facturation.',
    icon: 'shield-check',
    metrics: [
      { label: 'Plans actifs', value: '35', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Premium', value: '9', tone: 'text-purple-600 bg-purple-50' },
      { label: 'À renouveler', value: '4', tone: 'text-orange-600 bg-orange-50' },
    ],
    queue: [
      { item: 'Prestige Pressing - Premium', owner: 'Finance', status: 'Payé', priority: 'Normale' },
      { item: 'Clean Express - Standard', owner: 'Sales', status: 'Renouvellement', priority: 'Haute' },
      { item: 'LogiMoto - Fleet', owner: 'Finance', status: 'Facture ouverte', priority: 'Moyenne' },
    ],
    actions: ['Changer plan', 'Émettre facture', 'Sponsoriser partenaire'],
    connections: ['Finance', 'Publicités', 'Partenaires', 'Revenue Leakage'],
  },
  Litiges: {
    title: 'Litiges',
    description: 'Centralisez les litiges clients, partenaires et chauffeurs avec preuves, SLA et décisions.',
    icon: 'exclamation-circle',
    metrics: [
      { label: 'Ouverts', value: '8', tone: 'text-red-600 bg-red-50' },
      { label: 'Remboursements', value: '3', tone: 'text-orange-600 bg-orange-50' },
      { label: 'Résolus', value: '21', tone: 'text-green-600 bg-green-50' },
    ],
    queue: [
      { item: 'ORD-1022 - chemise perdue', owner: 'Support', status: 'Preuve partenaire', priority: 'Critique' },
      { item: 'ORD-1031 - retard livraison', owner: 'Logistique', status: 'En médiation', priority: 'Haute' },
      { item: 'PAY-884 - paiement échoué', owner: 'Finance', status: 'À rembourser', priority: 'Moyenne' },
    ],
    actions: ['Ouvrir médiation', 'Approuver remboursement', 'Notifier client'],
    connections: ['Support', 'Remboursements', 'Notifications', 'Order Truth'],
  },
  Zones: {
    title: 'Gestion des zones',
    description: 'Pilotez communes couvertes, frais de livraison, capacité logistique et zones saturées.',
    icon: 'map',
    metrics: [
      { label: 'Communes couvertes', value: '12', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Zones saturées', value: '2', tone: 'text-orange-600 bg-orange-50' },
      { label: 'SLA moyen', value: '34 min', tone: 'text-green-600 bg-green-50' },
    ],
    queue: [
      { item: 'Limete - pic 18h', owner: 'Dispatch', status: 'Renfort requis', priority: 'Haute' },
      { item: 'Gombe - premium', owner: 'Pricing', status: 'Tarif stable', priority: 'Normale' },
      { item: 'Masina - extension', owner: 'Ops', status: 'Test flotte', priority: 'Moyenne' },
    ],
    actions: ['Créer zone', 'Ajuster frais', 'Ajouter renfort'],
    connections: ['Cockpit Dispatcher', 'Kinshasa Map', 'Chauffeurs', 'Services'],
  },
  Commissions: {
    title: 'Commissions',
    description: 'Contrôlez commissions marketplace, frais logistiques, soldes partenaires et anomalies de marge.',
    icon: 'currencyDollar',
    metrics: [
      { label: 'Commission moyenne', value: '12%', tone: 'text-blue-600 bg-blue-50' },
      { label: 'À reverser', value: '8.2M FC', tone: 'text-green-600 bg-green-50' },
      { label: 'Écarts', value: '4', tone: 'text-red-600 bg-red-50' },
    ],
    queue: [
      { item: 'Prestige Pressing - semaine 23', owner: 'Finance', status: 'À payer', priority: 'Haute' },
      { item: 'Clean Express - frais promo', owner: 'Finance', status: 'Écart marge', priority: 'Critique' },
      { item: 'LogiMoto - commission livraison', owner: 'Ops', status: 'Validé', priority: 'Normale' },
    ],
    actions: ['Calculer commissions', 'Valider reversement', 'Analyser écart'],
    connections: ['Revenus', 'Paiements', 'Revenue Leakage', 'Partenaires'],
  },
  Remboursements: {
    title: 'Remboursements',
    description: 'Traitez les remboursements client avec validation support, finance et notification automatique.',
    icon: 'arrow-path',
    metrics: [
      { label: 'Demandes', value: '7', tone: 'text-orange-600 bg-orange-50' },
      { label: 'Montant', value: '340k FC', tone: 'text-red-600 bg-red-50' },
      { label: 'Approuvés', value: '4', tone: 'text-green-600 bg-green-50' },
    ],
    queue: [
      { item: 'REF-204 - lavage incomplet', owner: 'Support', status: 'À approuver', priority: 'Haute' },
      { item: 'REF-205 - double paiement', owner: 'Finance', status: 'Preuve OK', priority: 'Critique' },
      { item: 'REF-206 - annulation', owner: 'Support', status: 'Client notifié', priority: 'Normale' },
    ],
    actions: ['Approuver', 'Rejeter', 'Notifier'],
    connections: ['Litiges', 'Paiements', 'Support', 'Notifications'],
  },
  Promotions: {
    title: 'Promotions',
    description: 'Créez des offres ciblées, codes promo, remises sponsorisées et règles anti-abus.',
    icon: 'gift',
    metrics: [
      { label: 'Campagnes live', value: '4', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Conversions', value: '18%', tone: 'text-green-600 bg-green-50' },
      { label: 'Budget restant', value: '1.2M FC', tone: 'text-purple-600 bg-purple-50' },
    ],
    queue: [
      { item: 'Première commande -30%', owner: 'Growth', status: 'Active', priority: 'Haute' },
      { item: 'Lessive kilo weekend', owner: 'Marketplace', status: 'Planifiée', priority: 'Moyenne' },
      { item: 'Prestige sponsorisé', owner: 'Sales', status: 'À publier', priority: 'Normale' },
    ],
    actions: ['Créer promo', 'Limiter usage', 'Voir performance'],
    connections: ['Publicités', 'Services', 'Campagnes', 'Analytics'],
  },
  Publicités: {
    title: 'Publicités',
    description: 'Pilotez bannières, partenaires sponsorisés, placements premium et inventaire marketplace.',
    icon: 'share',
    metrics: [
      { label: 'Emplacements', value: '9', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Sponsorisé', value: '6', tone: 'text-orange-600 bg-orange-50' },
      { label: 'CTR moyen', value: '4.8%', tone: 'text-green-600 bg-green-50' },
    ],
    queue: [
      { item: 'Hero home - pressing premium', owner: 'Growth', status: 'Live', priority: 'Haute' },
      { item: 'Partenaires mis en avant', owner: 'Marketplace', status: 'Rotation active', priority: 'Normale' },
      { item: 'Bannière lessive kilo', owner: 'Design', status: 'À valider', priority: 'Moyenne' },
    ],
    actions: ['Créer placement', 'Planifier bannière', 'Mesurer CTR'],
    connections: ['Bannières', 'Partenaires', 'Promotions', 'Analytics'],
  },
  Fidélité: {
    title: 'Programme de fidélité',
    description: 'Configurez points, paliers, avantages et règles de rétention pour clients récurrents.',
    icon: 'star',
    metrics: [
      { label: 'Membres actifs', value: '820', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Points émis', value: '2.4M', tone: 'text-purple-600 bg-purple-50' },
      { label: 'Rachat', value: '31%', tone: 'text-green-600 bg-green-50' },
    ],
    queue: [
      { item: 'Palier Gold', owner: 'Growth', status: 'Actif', priority: 'Normale' },
      { item: 'Bonus livraison', owner: 'Ops', status: 'À tester', priority: 'Moyenne' },
      { item: 'Points expirés', owner: 'Support', status: 'Notification', priority: 'Haute' },
    ],
    actions: ['Créer palier', 'Ajuster earn rate', 'Envoyer rappel'],
    connections: ['Notifications', 'Campagnes', 'Utilisateurs', 'Analytics'],
  },
  Parrainage: {
    title: 'Parrainage',
    description: 'Suivez codes referral, récompenses, fraudes potentielles et croissance organique.',
    icon: 'users',
    metrics: [
      { label: 'Invitations', value: '312', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Conversions', value: '74', tone: 'text-green-600 bg-green-50' },
      { label: 'Suspects', value: '3', tone: 'text-red-600 bg-red-50' },
    ],
    queue: [
      { item: 'Marie K. - 12 filleuls', owner: 'Growth', status: 'Validé', priority: 'Normale' },
      { item: 'Code RDCWASH', owner: 'Marketing', status: 'Actif', priority: 'Haute' },
      { item: 'Fraude multi-compte', owner: 'Risk', status: 'À vérifier', priority: 'Critique' },
    ],
    actions: ['Créer code', 'Bloquer abus', 'Payer récompense'],
    connections: ['Utilisateurs', 'Promotions', 'Notifications', 'Investigate'],
  },
  Campagnes: {
    title: 'Campagnes',
    description: 'Orchestrez SMS, email, WhatsApp et push transactionnels ou marketing.',
    icon: 'paper-plane',
    metrics: [
      { label: 'Campagnes actives', value: '5', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Taux ouverture', value: '42%', tone: 'text-green-600 bg-green-50' },
      { label: 'Échecs', value: '18', tone: 'text-orange-600 bg-orange-50' },
    ],
    queue: [
      { item: 'Relance panier abandonné', owner: 'Growth', status: 'Active', priority: 'Haute' },
      { item: 'Notification SLA retard', owner: 'Ops', status: 'Automatique', priority: 'Critique' },
      { item: 'Promo weekend', owner: 'Marketing', status: 'Brouillon', priority: 'Moyenne' },
    ],
    actions: ['Créer campagne', 'Tester canal', 'Voir logs'],
    connections: ['WhatsApp', 'SMS', 'Email', 'Notifications'],
  },
  Utilisateurs: {
    title: 'Gestion des utilisateurs',
    description: 'Consultez clients, rôles, historique commandes, risques et segmentation CRM.',
    icon: 'users',
    metrics: [
      { label: 'Clients', value: '1 204', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Actifs 30j', value: '486', tone: 'text-green-600 bg-green-50' },
      { label: 'À vérifier', value: '11', tone: 'text-orange-600 bg-orange-50' },
    ],
    queue: [
      { item: 'marie.kabongo@example.com', owner: 'CRM', status: 'VIP', priority: 'Normale' },
      { item: 'john.doe@example.com', owner: 'Support', status: 'Ticket ouvert', priority: 'Haute' },
      { item: 'jean.mutombo@example.com', owner: 'Risk', status: 'Téléphone à vérifier', priority: 'Moyenne' },
    ],
    actions: ['Voir profil', 'Segmenter', 'Suspendre compte'],
    connections: ['Commandes', 'Support', 'Fidélité', 'Notifications'],
  },
  'Avis & Notes': {
    title: 'Avis & Notes',
    description: 'Modérez les avis, suivez les notes partenaires et déclenchez les plans qualité.',
    icon: 'star',
    metrics: [
      { label: 'Note moyenne', value: '4.8/5', tone: 'text-green-600 bg-green-50' },
      { label: 'Avis récents', value: '76', tone: 'text-blue-600 bg-blue-50' },
      { label: 'À répondre', value: '9', tone: 'text-orange-600 bg-orange-50' },
    ],
    queue: [
      { item: 'Prestige Pressing - 5★', owner: 'Marketplace', status: 'Publié', priority: 'Normale' },
      { item: 'Clean Express - 2★', owner: 'Qualité', status: 'Réponse requise', priority: 'Haute' },
      { item: 'Driver Koffi - 3★', owner: 'Logistique', status: 'Coaching', priority: 'Moyenne' },
    ],
    actions: ['Répondre', 'Escalader qualité', 'Masquer abus'],
    connections: ['Partenaires', 'Chauffeurs', 'Support', 'Analytics'],
  },
  Réclamations: {
    title: 'Réclamations',
    description: 'Priorisez les réclamations clients et reliez-les aux commandes, remboursements et notifications.',
    icon: 'lifebuoy',
    metrics: [
      { label: 'Ouvertes', value: '12', tone: 'text-red-600 bg-red-50' },
      { label: 'Temps moyen', value: '18 min', tone: 'text-green-600 bg-green-50' },
      { label: 'Escaladées', value: '4', tone: 'text-orange-600 bg-orange-50' },
    ],
    queue: [
      { item: 'SUP-021 - paiement échoué', owner: 'Support', status: 'Ouvert', priority: 'Critique' },
      { item: 'SUP-022 - retard collecte', owner: 'Ops', status: 'En cours', priority: 'Haute' },
      { item: 'SUP-023 - article abîmé', owner: 'Qualité', status: 'Preuve attendue', priority: 'Moyenne' },
    ],
    actions: ['Assigner agent', 'Notifier client', 'Créer litige'],
    connections: ['Support', 'Litiges', 'Remboursements', 'Notifications'],
  },
  'Pages & CMS': {
    title: 'Pages & CMS',
    description: 'Gérez contenus publics, textes légaux, pages SEO et mises à jour éditoriales.',
    icon: 'document-text',
    metrics: [
      { label: 'Pages publiées', value: '14', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Brouillons', value: '3', tone: 'text-orange-600 bg-orange-50' },
      { label: 'SEO OK', value: '92%', tone: 'text-green-600 bg-green-50' },
    ],
    queue: [
      { item: 'Devenir partenaire', owner: 'Content', status: 'Publié', priority: 'Haute' },
      { item: 'FAQ livraison', owner: 'Support', status: 'À mettre à jour', priority: 'Moyenne' },
      { item: 'CGU', owner: 'Legal', status: 'Validation', priority: 'Haute' },
    ],
    actions: ['Créer page', 'Publier', 'Prévisualiser'],
    connections: ['Bannières', 'Blog', 'SEO', 'Support'],
  },
  Bannières: {
    title: 'Bannières',
    description: 'Planifiez les bannières home, marketplace, partenaire sponsorisé et messages urgence.',
    icon: 'photo',
    metrics: [
      { label: 'Actives', value: '6', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Planifiées', value: '4', tone: 'text-purple-600 bg-purple-50' },
      { label: 'CTR', value: '5.1%', tone: 'text-green-600 bg-green-50' },
    ],
    queue: [
      { item: 'Première commande', owner: 'Growth', status: 'Live', priority: 'Haute' },
      { item: 'Pressing sponsorisé', owner: 'Sales', status: 'Rotation', priority: 'Normale' },
      { item: 'Alerte météo', owner: 'Ops', status: 'Prête', priority: 'Moyenne' },
    ],
    actions: ['Créer bannière', 'Planifier', 'A/B tester'],
    connections: ['Publicités', 'Promotions', 'Pages & CMS', 'Analytics'],
  },
  Blog: {
    title: 'Blog',
    description: 'Publiez conseils textile, actualités partenaires et contenus SEO pour Kinshasa.',
    icon: 'document',
    metrics: [
      { label: 'Articles', value: '28', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Brouillons', value: '5', tone: 'text-orange-600 bg-orange-50' },
      { label: 'Trafic SEO', value: '+18%', tone: 'text-green-600 bg-green-50' },
    ],
    queue: [
      { item: 'Comment laver une couette', owner: 'Content', status: 'Brouillon', priority: 'Moyenne' },
      { item: 'Top pressings Gombe', owner: 'SEO', status: 'À valider', priority: 'Haute' },
      { item: 'Guide lessive kilo', owner: 'Marketplace', status: 'Publié', priority: 'Normale' },
    ],
    actions: ['Créer article', 'Optimiser SEO', 'Publier'],
    connections: ['Pages & CMS', 'Services', 'Partenaires', 'Analytics'],
  },
  Notifications: {
    title: 'Notifications',
    description: 'Configurez les notifications client, partenaire, logistique, chauffeur et administrateur.',
    icon: 'bell',
    metrics: [
      { label: 'Templates', value: '32', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Échecs 24h', value: '14', tone: 'text-orange-600 bg-orange-50' },
      { label: 'Livrées', value: '98%', tone: 'text-green-600 bg-green-50' },
    ],
    queue: [
      { item: 'Commande créée', owner: 'Système', status: 'Actif', priority: 'Critique' },
      { item: 'Partenaire accepte', owner: 'Marketplace', status: 'Actif', priority: 'Haute' },
      { item: 'Driver assigné', owner: 'Logistique', status: 'Actif', priority: 'Haute' },
    ],
    actions: ['Tester template', 'Voir logs', 'Créer règle'],
    connections: ['Campagnes', 'WhatsApp', 'SMS', 'Email'],
  },
  WhatsApp: {
    title: 'Intégration WhatsApp',
    description: 'Pilotez WhatsApp Business pour support, statuts de commande et relances client.',
    icon: 'chatBubble',
    metrics: [
      { label: 'Messages 24h', value: '642', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Taux livraison', value: '97%', tone: 'text-green-600 bg-green-50' },
      { label: 'Échecs', value: '9', tone: 'text-orange-600 bg-orange-50' },
    ],
    queue: [
      { item: 'Template confirmation', owner: 'Ops', status: 'Approuvé', priority: 'Critique' },
      { item: 'Template retard', owner: 'Support', status: 'À tester', priority: 'Haute' },
      { item: 'Webhook entrant', owner: 'Tech', status: 'OK', priority: 'Normale' },
    ],
    actions: ['Tester envoi', 'Synchroniser templates', 'Voir webhooks'],
    connections: ['Notifications', 'Support', 'Campagnes', 'API & Webhooks'],
  },
  SMS: {
    title: 'Intégration SMS',
    description: 'Configurez les SMS transactionnels pour les clients sans data ou WhatsApp.',
    icon: 'device-phone-mobile',
    metrics: [
      { label: 'SMS 24h', value: '388', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Délivrés', value: '95%', tone: 'text-green-600 bg-green-50' },
      { label: 'Coût', value: '84k FC', tone: 'text-purple-600 bg-purple-50' },
    ],
    queue: [
      { item: 'OTP login', owner: 'Tech', status: 'Stable', priority: 'Critique' },
      { item: 'Statut commande', owner: 'Ops', status: 'Actif', priority: 'Haute' },
      { item: 'Relance paiement', owner: 'Finance', status: 'À surveiller', priority: 'Moyenne' },
    ],
    actions: ['Tester SMS', 'Changer provider', 'Exporter logs'],
    connections: ['Notifications', 'Campagnes', 'Utilisateurs', 'API & Webhooks'],
  },
  Email: {
    title: 'Intégration Email',
    description: 'Gérez emails transactionnels, factures, reçus et campagnes CRM.',
    icon: 'envelope',
    metrics: [
      { label: 'Emails 24h', value: '1 120', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Ouverture', value: '39%', tone: 'text-green-600 bg-green-50' },
      { label: 'Bounces', value: '2.1%', tone: 'text-orange-600 bg-orange-50' },
    ],
    queue: [
      { item: 'Reçu paiement', owner: 'Finance', status: 'Actif', priority: 'Critique' },
      { item: 'Bienvenue client', owner: 'CRM', status: 'Actif', priority: 'Normale' },
      { item: 'Résumé partenaire', owner: 'Marketplace', status: 'À tester', priority: 'Moyenne' },
    ],
    actions: ['Tester email', 'Voir délivrabilité', 'Modifier template'],
    connections: ['Notifications', 'Campagnes', 'Paiements', 'Utilisateurs'],
  },
  'API & Webhooks': {
    title: 'API & Webhooks',
    description: 'Surveillez clés API, webhooks partenaires, paiements et événements opérationnels.',
    icon: 'code-bracket',
    metrics: [
      { label: 'Webhooks actifs', value: '18', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Erreurs 24h', value: '5', tone: 'text-red-600 bg-red-50' },
      { label: 'Latence', value: '180 ms', tone: 'text-green-600 bg-green-50' },
    ],
    queue: [
      { item: 'payment.succeeded', owner: 'Finance', status: 'OK', priority: 'Critique' },
      { item: 'order.status_changed', owner: 'Ops', status: 'OK', priority: 'Critique' },
      { item: 'partner.updated', owner: 'Marketplace', status: 'Retry', priority: 'Haute' },
    ],
    actions: ['Créer clé', 'Rejouer webhook', 'Voir erreurs'],
    connections: ['Paiements', 'Notifications', 'WhatsApp', 'SMS'],
  },
  'Gestion Admin': {
    title: 'Gestion Admin',
    description: 'Gérez les administrateurs, rôles internes, niveaux d’accès et responsabilité opérationnelle.',
    icon: 'user',
    metrics: [
      { label: 'Admins', value: '7', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Superadmins', value: '2', tone: 'text-purple-600 bg-purple-50' },
      { label: 'Invitations', value: '1', tone: 'text-orange-600 bg-orange-50' },
    ],
    queue: [
      { item: 'admin@laundry.app', owner: 'Direction', status: 'Superadmin', priority: 'Critique' },
      { item: 'ops@laundry.app', owner: 'Ops', status: 'Admin ops', priority: 'Haute' },
      { item: 'support@laundry.app', owner: 'Support', status: 'À inviter', priority: 'Moyenne' },
    ],
    actions: ['Inviter admin', 'Modifier rôle', 'Révoquer accès'],
    connections: ['Permissions', 'Journal admin', 'Activity Log', 'Support'],
  },
  Permissions: {
    title: 'Permissions',
    description: 'Définissez les droits par rôle et protégez les actions sensibles du control center.',
    icon: 'shield-check',
    metrics: [
      { label: 'Rôles', value: '6', tone: 'text-blue-600 bg-blue-50' },
      { label: 'Actions critiques', value: '14', tone: 'text-red-600 bg-red-50' },
      { label: 'Audité', value: '100%', tone: 'text-green-600 bg-green-50' },
    ],
    queue: [
      { item: 'Finance - remboursements', owner: 'Security', status: '2FA requis', priority: 'Critique' },
      { item: 'Support - lecture client', owner: 'Security', status: 'OK', priority: 'Normale' },
      { item: 'Ops - réassignation', owner: 'Security', status: 'Audit actif', priority: 'Haute' },
    ],
    actions: ['Créer rôle', 'Auditer accès', 'Exporter matrice'],
    connections: ['Gestion Admin', 'Journal admin', 'API & Webhooks', 'Activity Log'],
  },
};

const legacySectionMap: Record<string, string> = {
  dashboard: 'Dashboard',
  partners: 'Partenaires',
  'partner-applications': 'Candidatures',
  services: 'Services',
  users: 'Utilisateurs',
  orders: 'Commandes',
  drivers: 'Chauffeurs',
  promotions: 'Promotions',
  advertisements: 'Publicités',
  loyalty: 'Fidélité',
  referral: 'Parrainage',
  content: 'Pages & CMS',
  support: 'Support',
  analytics: 'Analytics',
  adminManagement: 'Gestion Admin',
  tracking: 'API & Webhooks',
  subscriptions: 'Abonnements',
  refunds: 'Remboursements',
  activity: 'Activity Log',
  ops_dashboard: 'Truth Dashboard',
  ops_truth: 'Order Truth',
  ops_anomalies: 'Anomalies',
  ops_investigate: 'Investigate',
};

const AdminModulePage: React.FC<{ config: ModuleConfig; onAction: (message: string) => void }> = ({ config, onAction }) => (
  <section className="space-y-6">
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
            <Icon name={config.icon as any} className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
            <p className="text-sm text-gray-500 max-w-3xl mt-1">{config.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.actions.map((action) => (
            <button
              type="button"
              key={action}
              onClick={() => onAction(`${action} - ${config.title}`)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {config.metrics.map((metric) => (
        <div key={metric.label} className={`rounded-2xl p-5 ${metric.tone}`}>
          <p className="text-sm font-medium opacity-80">{metric.label}</p>
          <p className="text-3xl font-extrabold mt-2">{metric.value}</p>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">File opérationnelle</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Élément</th>
                <th className="px-6 py-3 text-left">Responsable</th>
                <th className="px-6 py-3 text-left">Statut</th>
                <th className="px-6 py-3 text-left">Priorité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {config.queue.map((row) => (
                <tr key={row.item} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">{row.item}</td>
                  <td className="px-6 py-4 text-gray-600">{row.owner}</td>
                  <td className="px-6 py-4 text-gray-600">{row.status}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      row.priority === 'Critique'
                        ? 'bg-red-50 text-red-700'
                        : row.priority === 'Haute'
                        ? 'bg-orange-50 text-orange-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {row.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">Connexions système</h3>
        <div className="space-y-3">
          {config.connections.map((connection) => (
            <div key={connection} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2">
              <Icon name="check" className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">{connection}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export const AdminControlCenter: React.FC = () => {
  const { adminSectionParams, setAdminSectionParams } = useAppContext();
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleNavigate = (item: string) => {
    setActiveItem(item);
    setActionMessage(null);
  };

  const handleAction = (message: string) => {
    setActionMessage(message);
  };

  useEffect(() => {
    if (!adminSectionParams?.section) return;

    const mappedSection = legacySectionMap[String(adminSectionParams.section)] || String(adminSectionParams.section);
    setActiveItem(mappedSection);

    if (adminSectionParams.orderId) {
      setActionMessage(`Contexte chargé pour la commande ${adminSectionParams.orderId}.`);
    }

    setAdminSectionParams(null);
  }, [adminSectionParams, setAdminSectionParams]);

  useEffect(() => {
    const handleAdminAction = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail) setActionMessage(detail);
    };

    window.addEventListener('admin-action', handleAdminAction);
    return () => window.removeEventListener('admin-action', handleAdminAction);
  }, []);

  const renderContent = () => {
    switch (activeItem) {
      // PILOTAGE
      case 'Dashboard':
        return (
          <>
            <AlertBar />
            <KpiRow />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <LiveOperations />
              <KinshasaMap />
            </div>
            <CockpitDispatcher />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SlaCenter />
              <RevenueLeakage />
            </div>
            <PartnerHealthScore />
            <AnalyticsRow />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <TruthDashboard />
              <AnomaliesTable />
            </div>
            <ChauffeurPerformance />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <FinanceSummary />
              <SupportCenter />
              <QuickActions onNavigate={handleNavigate} />
            </div>
          </>
        );
      case 'Truth Dashboard':
        return <TruthDashboard />;
      case 'Order Truth':
        return <TruthDashboard />;
      case 'Anomalies':
        return <AnomaliesTable />;
      case 'Investigate':
        return <AdminModulePage config={moduleConfigs.Investigate} onAction={handleAction} />;
      case 'Analytics':
        return <AnalyticsRow />;
      case 'Activity Log':
        return <LiveOperations />;

      // MARKETPLACE
      case 'Partenaires':
        return <PartnerHealthScore />;
      case 'Candidatures':
        return <AdminModulePage config={moduleConfigs.Candidatures} onAction={handleAction} />;
      case 'Services':
        return <AdminModulePage config={moduleConfigs.Services} onAction={handleAction} />;
      case 'Abonnements':
        return <AdminModulePage config={moduleConfigs.Abonnements} onAction={handleAction} />;

      // COMMANDES
      case 'Commandes':
        return (
          <>
            <KpiRow />
            <LiveOperations />
          </>
        );
      case 'Litiges':
        return <AdminModulePage config={moduleConfigs.Litiges} onAction={handleAction} />;

      // LOGISTIQUE
      case 'Cockpit Dispatcher':
        return (
          <>
            <CockpitDispatcher />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SlaCenter />
              <KinshasaMap />
            </div>
          </>
        );
      case 'Missions':
        return <CockpitDispatcher />;
      case 'Chauffeurs':
        return <ChauffeurPerformance />;
      case 'Zones':
        return <AdminModulePage config={moduleConfigs.Zones} onAction={handleAction} />;
      case 'SLA Center':
        return <SlaCenter />;

      // FINANCE
      case 'Revenus':
        return (
          <>
            <FinanceSummary />
            <AnalyticsRow />
          </>
        );
      case 'Commissions':
        return <AdminModulePage config={moduleConfigs.Commissions} onAction={handleAction} />;
      case 'Remboursements':
        return <AdminModulePage config={moduleConfigs.Remboursements} onAction={handleAction} />;
      case 'Paiements':
        return <FinanceSummary />;
      case 'Revenue Leakage':
        return <RevenueLeakage />;

      // CROISSANCE
      case 'Promotions':
        return <AdminModulePage config={moduleConfigs.Promotions} onAction={handleAction} />;
      case 'Publicités':
        return <AdminModulePage config={moduleConfigs.Publicités} onAction={handleAction} />;
      case 'Fidélité':
        return <AdminModulePage config={moduleConfigs.Fidélité} onAction={handleAction} />;
      case 'Parrainage':
        return <AdminModulePage config={moduleConfigs.Parrainage} onAction={handleAction} />;
      case 'Campagnes':
        return <AdminModulePage config={moduleConfigs.Campagnes} onAction={handleAction} />;

      // CLIENTS
      case 'Utilisateurs':
        return <AdminModulePage config={moduleConfigs.Utilisateurs} onAction={handleAction} />;
      case 'Support':
        return <SupportCenter />;
      case 'Avis & Notes':
        return <AdminModulePage config={moduleConfigs['Avis & Notes']} onAction={handleAction} />;
      case 'Réclamations':
        return <AdminModulePage config={moduleConfigs.Réclamations} onAction={handleAction} />;

      // CONTENU
      case 'Pages & CMS':
        return <AdminModulePage config={moduleConfigs['Pages & CMS']} onAction={handleAction} />;
      case 'Bannières':
        return <AdminModulePage config={moduleConfigs.Bannières} onAction={handleAction} />;
      case 'Blog':
        return <AdminModulePage config={moduleConfigs.Blog} onAction={handleAction} />;
      case 'Notifications':
        return <AdminModulePage config={moduleConfigs.Notifications} onAction={handleAction} />;

      // INTÉGRATIONS
      case 'Passerelles paiement':
        return <FinanceSummary />;
      case 'WhatsApp':
        return <AdminModulePage config={moduleConfigs.WhatsApp} onAction={handleAction} />;
      case 'SMS':
        return <AdminModulePage config={moduleConfigs.SMS} onAction={handleAction} />;
      case 'Email':
        return <AdminModulePage config={moduleConfigs.Email} onAction={handleAction} />;
      case 'API & Webhooks':
        return <AdminModulePage config={moduleConfigs['API & Webhooks']} onAction={handleAction} />;

      // ADMINISTRATION
      case 'Gestion Admin':
        return <AdminModulePage config={moduleConfigs['Gestion Admin']} onAction={handleAction} />;
      case 'Permissions':
        return <AdminModulePage config={moduleConfigs.Permissions} onAction={handleAction} />;
      case 'Journal admin':
        return <LiveOperations />;

      default:
        return (
          <>
            <AlertBar />
            <KpiRow />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <LiveOperations />
              <KinshasaMap />
            </div>
            <CockpitDispatcher />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <ControlCenterSidebar activeItem={activeItem} onItemClick={handleNavigate} />
      <div className="flex-1 lg:ml-[260px]">
        <ControlCenterHeader activeItem={activeItem} onNavigate={handleNavigate} onAction={handleAction} />
        <div className="lg:hidden border-b border-gray-200 bg-white px-4 py-3">
          <label htmlFor="admin-mobile-section" className="sr-only">Section admin</label>
          <select
            id="admin-mobile-section"
            value={activeItem}
            onChange={(event) => handleNavigate(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {controlCenterSections.map((section) => (
              <optgroup key={section.title} label={section.title}>
                {section.items.map((item) => (
                  <option key={item.label} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="p-6 space-y-6">
          {actionMessage && (
            <div role="status" className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700">
              {actionMessage}
            </div>
          )}
          {renderContent()}
        </div>
        <TechFooter />
      </div>
    </div>
  );
};
