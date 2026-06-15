
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { AdminAccountBar } from '../components/admin/AdminAccountBar';
import { AdminStatusBanner } from '../components/admin/AdminStatusBanner';
import { ControlCenterSidebar, controlCenterSections } from '../components/admin/ControlCenterSidebar';
import { ControlCenterHeader } from '../components/admin/ControlCenterHeader';
import { TechFooter } from '../components/admin/TechFooter';
import { Icon } from '../components/Icon';

// Real pages - PILOTAGE
import { TruthDashboard } from './ops/TruthDashboard';
import { OrderTruthPage } from './ops/OrderTruthPage';
import { AnomalyCenterPage } from './AnomalyCenterPage';
import { InvestigatePage } from './ops/InvestigatePage';

// Real pages - MARKETPLACE
import { PartnerManagement } from './admin/PartnerManagement';
import { PartnerApplicationsPage } from './admin/PartnerApplicationsPage';
import { ServicesControlCenter } from './ServicesControlCenter';
import { SubscriptionsControlCenter } from './SubscriptionsControlCenter';

// Real pages - COMMANDES
import { OrderManagement } from './admin/OrderManagement';
import { OrdersControlCenter } from './OrdersControlCenter';
import { RefundsControlCenter } from './RefundsControlCenter';
import { DisputesControlCenter } from './DisputesControlCenter';

// Real pages - LOGISTIQUE
import { CockpitDispatcher } from '../components/admin/CockpitDispatcher';
import { DispatcherControlCenter } from './DispatcherControlCenter';
import { DriversControlCenter } from './DriversControlCenter';
import { ZonesControlCenter } from './ZonesControlCenter';
import { SlaCenter } from '../components/admin/SlaCenter';
import { SlaControlCenter } from './SlaControlCenter';

// Real pages - FINANCE
import { FinanceSummary } from '../components/admin/FinanceSummary';
import { PaymentsControlCenter } from './PaymentsControlCenter';
import { RevenueLeakage } from '../components/admin/RevenueLeakage';
import { RevenueLeakageControlCenter } from './RevenueLeakageControlCenter';
import { RevenueControlCenter } from './RevenueControlCenter';
import { CommissionsControlCenter } from './CommissionsControlCenter';

// Real pages - CROISSANCE
import { PromotionsControlCenter } from './PromotionsControlCenter';
import { AdsControlCenter } from './AdsControlCenter';
import { LoyaltyControlCenter } from './LoyaltyControlCenter';
import { ReferralsControlCenter } from './ReferralsControlCenter';
import { CampaignsControlCenter } from './CampaignsControlCenter';

// Real pages - CLIENTS
import { UsersControlCenter } from './UsersControlCenter';
import { ReviewsControlCenter } from './ReviewsControlCenter';
import { ClaimsControlCenter } from './ClaimsControlCenter';
import { SupportControlCenter } from './SupportControlCenter';
import { SupportManagement } from './admin/SupportManagement';

// Real pages - CONTENU
import { CmsControlCenter } from './CmsControlCenter';
import { BlogControlCenter } from './BlogControlCenter';
import { NotificationsControlCenter } from './NotificationsControlCenter';
import { PaymentGatewaysControlCenter } from './PaymentGatewaysControlCenter';
import { WhatsappControlCenter } from './WhatsappControlCenter';
import { SmsControlCenter } from './SmsControlCenter';
import { EmailControlCenter } from './EmailControlCenter';
import { IntegrationsControlCenter } from './IntegrationsControlCenter';

// Real pages - ADMINISTRATION
import { AdminManagementControlCenter } from './AdminManagementControlCenter';
import { PermissionsControlCenter } from './PermissionsControlCenter';
import { ActivityLogControlCenter } from './ActivityLogControlCenter';
import { Analytics as AdminAnalytics } from './admin/Analytics';

// Overview widgets (dashboard-only)
import { AlertBar } from '../components/admin/AlertBar';
import { KpiRow } from '../components/admin/KpiRow';
import { LiveOperations } from '../components/admin/LiveOperations';
import { KinshasaMap } from '../components/admin/KinshasaMap';
import { PartnerHealthScore } from '../components/admin/PartnerHealthScore';
import { AnalyticsRow } from '../components/admin/AnalyticsRow';
import { ChauffeurPerformance } from '../components/admin/ChauffeurPerformance';
import { SupportCenter } from '../components/admin/SupportCenter';
import { QuickActions } from '../components/admin/QuickActions';
import { OperationsIntelligence } from '../components/admin/OperationsIntelligence';

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
  blog: 'Blog',
  notifications: 'Notifications',
  'payment-gateways': 'Passerelles paiement',
  'integrations/whatsapp': 'WhatsApp',
  whatsapp: 'WhatsApp',
  'integrations/sms': 'SMS',
  sms: 'SMS',
  'integrations/email': 'Email',
  email: 'Email',
  'integrations/api-webhooks': 'API & Webhooks',
  'api-webhooks': 'API & Webhooks',
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

const ModulePage: React.FC<{ title: string; description: string; icon: string; connections: string[] }> = ({ title, description, icon, connections }) => (
  <div className="bg-surface-card rounded-2xl border border-surface-border-subtle shadow-sm p-8">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
          <Icon name={icon as any} className="w-7 h-7 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-2xl mt-1">{description}</p>
          <p className="mt-3 inline-flex rounded-full bg-orange-50 dark:bg-orange-900/30 px-3 py-1 text-xs font-bold text-orange-700 dark:text-orange-300">
            Module à connecter au backend avant activation des actions sensibles.
          </p>
        </div>
      </div>
    </div>
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {connections.map((connection) => (
        <div key={connection} className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 px-3 py-2">
          <Icon name="check" className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{connection}</span>
        </div>
      ))}
    </div>
  </div>
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
    const handleAdminNavigate = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (!detail) return;
      setActiveItem(detail);
      setActionMessage(null);
    };
    const handleAdminActionMessage = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail) setActionMessage(detail);
    };

    window.addEventListener('admin-action', handleAdminAction);
    window.addEventListener('admin-navigate', handleAdminNavigate);
    window.addEventListener('admin-action-message', handleAdminActionMessage);
    return () => {
      window.removeEventListener('admin-action', handleAdminAction);
      window.removeEventListener('admin-navigate', handleAdminNavigate);
      window.removeEventListener('admin-action-message', handleAdminActionMessage);
    };
  }, []);

  const renderContent = () => {
    switch (activeItem) {

      // ─── PILOTAGE ───
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
            <OperationsIntelligence />
            <AnalyticsRow />
            <ChauffeurPerformance />
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-2">
                <FinanceSummary />
              </div>
              <SupportCenter />
              <QuickActions onNavigate={handleNavigate} />
            </div>
          </>
        );
      case 'Truth Dashboard':
        return <TruthDashboard />;
      case 'Order Truth':
        return <OrderTruthPage />;
      case 'Anomalies':
        return <AnomalyCenterPage />;
      case 'Investigate':
        return <InvestigatePage />;
      case 'Analytics':
        return <AdminAnalytics />;
      case 'Activity Log':
        return <ActivityLogControlCenter />;

      // ─── MARKETPLACE ───
      case 'Partenaires':
        return <PartnerManagement />;
      case 'Candidatures':
        return <PartnerApplicationsPage />;
      case 'Services':
        return <ServicesControlCenter />;
      case 'Abonnements':
        return <SubscriptionsControlCenter />;

      // ─── COMMANDES ───
      case 'Commandes':
        return <OrdersControlCenter />;
      case 'Litiges':
        return <DisputesControlCenter />;

      // ─── LOGISTIQUE ───
      case 'Cockpit Dispatcher':
        return <DispatcherControlCenter />;
      case 'Missions':
        return <DispatcherControlCenter />;
      case 'Chauffeurs':
        return <DriversControlCenter />;
      case 'Zones':
        return <ZonesControlCenter />;
      case 'SLA Center':
        return <SlaControlCenter />;

      // ─── FINANCE ───
      case 'Revenus':
        return <RevenueControlCenter />;
      case 'Commissions':
        return <CommissionsControlCenter />;
      case 'Remboursements':
        return <RefundsControlCenter />;
      case 'Paiements':
        return <PaymentsControlCenter />;
      case 'Revenue Leakage':
        return <RevenueLeakageControlCenter />;

      // ─── CROISSANCE ───
      case 'Promotions':
        return <PromotionsControlCenter />;
      case 'Publicités':
        return <AdsControlCenter />;
      case 'Fidélité':
        return <LoyaltyControlCenter />;
      case 'Parrainage':
        return <ReferralsControlCenter />;
      case 'Campagnes':
        return <CampaignsControlCenter />;

      // ─── CLIENTS ───
      case 'Utilisateurs':
        return <UsersControlCenter />;
      case 'Support':
        return <SupportControlCenter />;
      case 'Avis & Notes':
        return <ReviewsControlCenter />;
      case 'Réclamations':
        return <ClaimsControlCenter />;

      // ─── CONTENU ───
      case 'Pages & CMS':
        return <CmsControlCenter />;
      case 'Bannières':
        return <AdsControlCenter />;
      case 'Blog':
        return <BlogControlCenter />;
      case 'Notifications':
        return <NotificationsControlCenter />;

      // ─── INTÉGRATIONS ───
      case 'Passerelles paiement':
        return <PaymentGatewaysControlCenter />;
      case 'WhatsApp':
        return <WhatsappControlCenter />;
      case 'SMS':
        return <SmsControlCenter />;
      case 'Email':
        return <EmailControlCenter />;
      case 'API & Webhooks':
        return <IntegrationsControlCenter />;

      // ─── ADMINISTRATION ───
      case 'Gestion Admin':
        return <AdminManagementControlCenter />;
      case 'Permissions':
        return <PermissionsControlCenter />;
      case 'Journal admin':
        return <ActivityLogControlCenter />;

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

  const selfHeaderSections = new Set([
    'Litiges', 'Commandes', 'Abonnements', 'Cockpit Dispatcher', 'Missions', 'Chauffeurs', 'Zones', 'SLA Center',
    'Revenus', 'Commissions', 'Remboursements', 'Paiements', 'Revenue Leakage', 'Promotions',
    'Pages & CMS', 'Blog', 'Notifications', 'Passerelles paiement', 'WhatsApp', 'SMS', 'Email', 'API & Webhooks', 'Gestion Admin', 'Permissions', 'Journal admin', 'Réclamations', 'Publicités', 'Fidélité', 'Parrainage', 'Campagnes', 'Support', 'Avis & Notes',
  ]);

  return (
    <div className="admin-shell min-h-screen bg-surface-page text-content-primary flex">
      <ControlCenterSidebar activeItem={activeItem} onItemClick={handleNavigate} />
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
        <AdminAccountBar />
        {!selfHeaderSections.has(activeItem) && (
          <ControlCenterHeader
            activeItem={activeItem}
            onNavigate={handleNavigate}
            onAction={handleAction}
          />
        )}
        <div className="lg:hidden border-b border-surface-border bg-surface-card px-4 py-3">
          <label htmlFor="admin-mobile-section" className="sr-only">Section admin</label>
          <select
            id="admin-mobile-section"
            value={activeItem}
            onChange={(event) => handleNavigate(event.target.value)}
            className="w-full rounded-xl border border-surface-border bg-surface-muted px-3 py-2 text-sm font-semibold text-content-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <AdminStatusBanner variant="info" showIcon={false}>
              {actionMessage}
            </AdminStatusBanner>
          )}
          {renderContent()}
        </div>
        <TechFooter />
      </div>
    </div>
  );
};
