
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
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
import { ServiceManagement } from './admin/ServiceManagement';
import { SubscriptionManagement } from './admin/SubscriptionManagement';

// Real pages - COMMANDES
import { OrderManagement } from './admin/OrderManagement';
import { RefundManagement } from './admin/RefundManagement';

// Real pages - LOGISTIQUE (widgets only, no existing CRUD pages for these)
import { CockpitDispatcher } from '../components/admin/CockpitDispatcher';
import { DriverManagement } from './admin/DriverManagement';
import { SlaCenter } from '../components/admin/SlaCenter';

// Real pages - FINANCE
import { FinanceSummary } from '../components/admin/FinanceSummary';
import { RevenueLeakage } from '../components/admin/RevenueLeakage';
import { CommissionManagement } from './admin/CommissionManagement';

// Real pages - CROISSANCE
import { PromoManagement } from './admin/PromoManagement';
import { AdManagement } from './admin/AdManagement';
import { LoyaltyManagement } from './admin/LoyaltyManagement';
import { ReferralManagement } from './admin/ReferralManagement';

// Real pages - CLIENTS
import { UserManagement } from './admin/UserManagement';
import { SupportManagement } from './admin/SupportManagement';

// Real pages - CONTENU
import { ContentManagement } from './admin/ContentManagement';

// Real pages - ADMINISTRATION
import { AdminManagement } from './admin/AdminManagement';
import { ActivityLogManagement } from './admin/ActivityLogManagement';
import { Analytics as AdminAnalytics } from './admin/Analytics';
import { TrackingManagement } from './admin/TrackingManagement';

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
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
          <Icon name={icon as any} className="w-7 h-7 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 max-w-2xl mt-1">{description}</p>
          <p className="mt-3 inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
            Module à connecter au backend avant activation des actions sensibles.
          </p>
        </div>
      </div>
    </div>
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {connections.map((connection) => (
        <div key={connection} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
          <Icon name="check" className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-gray-700">{connection}</span>
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

    window.addEventListener('admin-action', handleAdminAction);
    return () => window.removeEventListener('admin-action', handleAdminAction);
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
        return <ActivityLogManagement />;

      // ─── MARKETPLACE ───
      case 'Partenaires':
        return <PartnerManagement />;
      case 'Candidatures':
        return <PartnerApplicationsPage />;
      case 'Services':
        return <ServiceManagement />;
      case 'Abonnements':
        return <SubscriptionManagement />;

      // ─── COMMANDES ───
      case 'Commandes':
        return <OrderManagement />;
      case 'Litiges':
        return <RefundManagement />;

      // ─── LOGISTIQUE ───
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
        return <DriverManagement />;
      case 'Zones':
        return (
          <ModulePage
            title="Gestion des zones"
            description="Définissez les zones de couverture, tarifs par zone et limites de livraison."
            icon="map"
            connections={['Cockpit Dispatcher', 'Chauffeurs', 'SLA Center', 'Services']}
          />
        );
      case 'SLA Center':
        return <SlaCenter />;

      // ─── FINANCE ───
      case 'Revenus':
        return (
          <>
            <FinanceSummary />
            <RevenueLeakage />
          </>
        );
      case 'Commissions':
        return <CommissionManagement />;
      case 'Remboursements':
        return <RefundManagement />;
      case 'Paiements':
        return <FinanceSummary />;
      case 'Revenue Leakage':
        return <RevenueLeakage />;

      // ─── CROISSANCE ───
      case 'Promotions':
        return <PromoManagement />;
      case 'Publicités':
        return <AdManagement />;
      case 'Fidélité':
        return <LoyaltyManagement />;
      case 'Parrainage':
        return <ReferralManagement />;
      case 'Campagnes':
        return (
          <ModulePage
            title="Campagnes"
            description="Créez des campagnes SMS, email et WhatsApp pour vos utilisateurs."
            icon="paper-plane"
            connections={['Notifications', 'WhatsApp', 'SMS', 'Email']}
          />
        );

      // ─── CLIENTS ───
      case 'Utilisateurs':
        return <UserManagement />;
      case 'Support':
        return <SupportManagement />;
      case 'Avis & Notes':
        return (
          <ModulePage
            title="Avis & Notes"
            description="Consultez les avis clients, notes partenaires et répondez aux évaluations."
            icon="star"
            connections={['Partenaires', 'Chauffeurs', 'Support', 'Analytics']}
          />
        );
      case 'Réclamations':
        return <SupportManagement />;

      // ─── CONTENU ───
      case 'Pages & CMS':
        return <ContentManagement />;
      case 'Bannières':
        return <AdManagement />;
      case 'Blog':
        return (
          <ModulePage
            title="Blog"
            description="Publiez des articles, conseils et actualités pour vos utilisateurs."
            icon="document"
            connections={['Pages & CMS', 'Services', 'Partenaires', 'Analytics']}
          />
        );
      case 'Notifications':
        return (
          <ModulePage
            title="Notifications"
            description="Configurez les notifications push, email et SMS automatiques."
            icon="bell"
            connections={['Campagnes', 'WhatsApp', 'SMS', 'Email']}
          />
        );

      // ─── INTÉGRATIONS ───
      case 'Passerelles paiement':
        return <FinanceSummary />;
      case 'WhatsApp':
        return (
          <ModulePage
            title="Intégration WhatsApp"
            description="Configurez l'envoi de notifications et le support client via WhatsApp Business API."
            icon="chatBubble"
            connections={['Notifications', 'Support', 'Campagnes', 'API & Webhooks']}
          />
        );
      case 'SMS':
        return (
          <ModulePage
            title="Intégration SMS"
            description="Configurez l'envoi de SMS transactionnels et marketing via les opérateurs locaux."
            icon="device-phone-mobile"
            connections={['Notifications', 'Campagnes', 'Utilisateurs', 'API & Webhooks']}
          />
        );
      case 'Email':
        return (
          <ModulePage
            title="Intégration Email"
            description="Configurez l'envoi d'emails transactionnels (confirmations, factures, notifications)."
            icon="envelope"
            connections={['Notifications', 'Campagnes', 'Paiements', 'Utilisateurs']}
          />
        );
      case 'API & Webhooks':
        return <TrackingManagement />;

      // ─── ADMINISTRATION ───
      case 'Gestion Admin':
        return <AdminManagement />;
      case 'Permissions':
        return (
          <ModulePage
            title="Permissions"
            description="Configurez la matrice de permissions par rôle et section du dashboard."
            icon="shield-check"
            connections={['Gestion Admin', 'Journal admin', 'Activity Log', 'API & Webhooks']}
          />
        );
      case 'Journal admin':
        return <ActivityLogManagement />;

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
        <ControlCenterHeader
          activeItem={activeItem}
          onNavigate={handleNavigate}
          onAction={handleAction}
        />
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
