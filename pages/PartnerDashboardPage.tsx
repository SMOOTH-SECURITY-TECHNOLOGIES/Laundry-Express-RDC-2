
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
// FIX: Using capitalized casing for the import to match the already included root file to resolve duplication error.
import { Dashboard } from './partner/Dashboard';
import { OrderManagement } from './partner/OrderManagement';
import { ProfileManagement } from './partner/ProfileManagement';
import { PromoManagement as PartnerPromoManagement } from './partner/PromoManagement';
import { Financials as PartnerFinancials } from './partner/Financials';
import { Analytics as PartnerAnalytics } from './partner/Analytics';
import { useNavigation } from '../context/NavigationContext';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { PartnerSidebar } from '../components/partner/PartnerSidebar';
import { TeamManagement } from './partner/TeamManagement';
import { UserRole, PartnerSection, Partner } from '../types';
import { DB } from '../constants';
import { ApiIntegrationsPage } from './partner/ApiIntegrationsPage';
import { AutomationPage } from './partner/AutomationPage';
import { SecurityPage } from './partner/SecurityPage';
import { SubscriptionPage } from './partner/SubscriptionPage';
import { InventoryManagement } from './partner/InventoryManagement';
import { DeliverySettings } from './partner/DeliverySettings';
import { InvoicingPage } from './partner/InvoicingPage';

export const PartnerDashboardPage: React.FC = () => {
    const { user, partners, setCurrentPage, t } = useAppContext();
    const { openChatForOrderId, openOrderDetailsForOrderId } = useNavigation();
    const [section, setSection] = useState<PartnerSection>('dashboard');

    useEffect(() => {
        if (openChatForOrderId) {
            setSection('orders');
        }
    }, [openChatForOrderId]);

    useEffect(() => {
        if (openOrderDetailsForOrderId) {
            setSection('dashboard');
        }
    }, [openOrderDetailsForOrderId]);

    const partner = useMemo<Partner | null>(() => {
        if (!user?.partnerId) return null;
        const ctxPartner = partners.find(p => p.id === user.partnerId);
        if (ctxPartner) return ctxPartner;
        // Fallback: load from local mock DB if not yet in context
        const dbPartners: Partner[] = DB.get('partners');
        return dbPartners.find(p => p.id === user.partnerId) || null;
    }, [user, partners]);

    if (!user?.partnerId) {
        return (
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <h2 className="text-2xl font-bold mb-4 text-red-600">{t('partnerDashboardPage.accessDenied')}</h2>
                <p className="text-gray-600 dark:text-slate-300 mb-6">{t('partnerDashboardPage.partnersOnly')}</p>
                <button
                // FIX: Pass a PageObject to setCurrentPage instead of a string.
                onClick={() => setCurrentPage({ name: 'home' })}
                className="px-6 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90"
                >
                {t('partnerDashboardPage.backToHome')}
                </button>
            </div>
        )
    }

    const renderAccessDenied = () => {
        return (
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <h2 className="text-2xl font-bold mb-4 text-red-600">{t('partnerDashboardPage.accessDenied')}</h2>
                <p className="text-gray-600 dark:text-slate-300 mb-6">
                    {t('partnerDashboardPage.insufficientPermissions')}
                </p>
                <button
                    onClick={() => setSection('dashboard')}
                    className="px-6 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90"
                >
                    {t('partnerDashboardPage.backToDashboard')}
                </button>
            </div>
        );
    };
    
    const renderSection = () => {
        const hasAccess = (allowedRoles: UserRole[]) => {
            return user?.role && allowedRoles.includes(user.role as UserRole);
        };

        switch (section) {
            case 'orders':
                return <OrderManagement setSection={setSection} />;
            case 'profile':
                if (!hasAccess(['partner-owner', 'partner-manager'])) return renderAccessDenied();
                return <ProfileManagement setSection={setSection} />;
            case 'promotions':
                if (!partner?.enabledFeatures?.promotions || !hasAccess(['partner-owner', 'partner-manager'])) return renderAccessDenied();
                return <PartnerPromoManagement />;
            case 'invoicing':
                if (!partner?.enabledFeatures?.invoiceGenerator || !hasAccess(['partner-owner', 'partner-manager'])) return renderAccessDenied();
                return <InvoicingPage />;
            case 'financials':
                if (!partner?.enabledFeatures?.financials || !hasAccess(['partner-owner'])) return renderAccessDenied();
                return <PartnerFinancials />;
            case 'analytics':
                if (!partner?.enabledFeatures?.analytics || !hasAccess(['partner-owner', 'partner-manager'])) return renderAccessDenied();
                return <PartnerAnalytics setSection={setSection} />;
            case 'team':
                if (!partner?.enabledFeatures?.teamManagement || !hasAccess(['partner-owner'])) return renderAccessDenied();
                return <TeamManagement />;
            case 'security':
                if (!hasAccess(['partner-owner'])) return renderAccessDenied();
                return <SecurityPage />;
            case 'api-integrations':
                if (!partner?.enabledFeatures?.apiAccess || !hasAccess(['partner-owner'])) return renderAccessDenied();
                return <ApiIntegrationsPage />;
            case 'automation':
                if (!partner?.enabledFeatures?.advancedAutomation || !hasAccess(['partner-owner'])) return renderAccessDenied();
                return <AutomationPage />;
            case 'subscription':
                if (!hasAccess(['partner-owner'])) return renderAccessDenied();
                return <SubscriptionPage />;
            case 'inventory':
                if (!hasAccess(['partner-owner', 'partner-manager'])) return renderAccessDenied();
                return <InventoryManagement />;
            case 'delivery':
                if (!hasAccess(['partner-owner'])) return renderAccessDenied();
                return <DeliverySettings />;
            case 'dashboard':
            default:
                return <Dashboard setSection={setSection} />;
        }
    }

    const handleNavClick = (target: PartnerSection, isExternal?: boolean) => {
        if (isExternal) {
            // FIX: Pass a PageObject to setCurrentPage instead of a string.
            setCurrentPage({ name: 'support' });
        } else {
            setSection(target);
        }
    };
    
    const sidebar = <PartnerSidebar partner={partner} activeSection={section} onSectionClick={handleNavClick} />;
    
    const mobileTitle = useMemo(() => {
        const key = `partnerDashboardPage.${section}`;
        const defaultText = section.charAt(0).toUpperCase() + section.slice(1);
        return t(key, { default: defaultText });
    }, [section, t]);

    return (
       <div className="partner-shell">
         <DashboardLayout sidebar={sidebar} mobileTitle={mobileTitle}>
              <div key={section} className="animate-fade-in">
                  {renderSection()}
              </div>
         </DashboardLayout>
       </div>
    )
}
