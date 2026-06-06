
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
// FIX: Consistently import from 'dashboard' without extension.
import { Dashboard } from './admin/dashboard';
import { PartnerManagement } from './admin/PartnerManagement';
import { UserManagement } from './admin/UserManagement';
import { OrderManagement } from './admin/OrderManagement';
import { PromoManagement } from './admin/PromoManagement';
import { ContentManagement } from './admin/ContentManagement';
import { SupportManagement } from './admin/SupportManagement';
import { DriverManagement } from './admin/DriverManagement';
import { ServiceManagement } from './admin/ServiceManagement';
import { LoyaltyManagement } from './admin/LoyaltyManagement';
import { ReferralManagement } from './admin/ReferralManagement';
import { Analytics as AdminAnalytics } from './admin/Analytics';
import { AdManagement } from './admin/AdManagement';
import { AdminSection } from '../types';
import { AdminManagement } from './admin/AdminManagement';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { TrackingManagement } from './admin/TrackingManagement';
import { SubscriptionManagement } from './admin/SubscriptionManagement';
import { RefundManagement } from './admin/RefundManagement';
import { ActivityLogManagement } from './admin/ActivityLogManagement';
import { TruthDashboard } from './ops/TruthDashboard';
import { OrderTruthPage } from './ops/OrderTruthPage';
import { AnomalyCenterPage } from './ops/AnomalyCenterPage';
import { InvestigatePage } from './ops/InvestigatePage';
import { PartnerApplicationsPage } from './admin/PartnerApplicationsPage';

export const AdminPage: React.FC = () => {
    const { user, setCurrentPage, logout, setOpenChatForOrderId, adminSectionParams, setAdminSectionParams, t } = useAppContext();
    const [section, setSection] = useState<AdminSection>('dashboard');

    const hasPermission = (section: AdminSection): boolean => {
        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return false;
        if (user.role === 'superadmin') return true;
        return user.permissions?.includes(section) ?? false;
    };

    useEffect(() => {
        if (adminSectionParams?.section) {
            setSection(adminSectionParams.section as AdminSection);
            if (adminSectionParams.section === 'orders' && adminSectionParams.orderId && adminSectionParams.openChat) {
                setOpenChatForOrderId(adminSectionParams.orderId);
            }
            setAdminSectionParams(null);
        }
    }, [adminSectionParams, setAdminSectionParams, setOpenChatForOrderId]);
    
    useEffect(() => {
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        setTimeout(() => {
            logout();
        }, 3000)
      }
    }, [user, logout, setCurrentPage])


    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return (
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <h2 className="text-2xl font-bold mb-4 text-red-600">{t('adminPage.accessDenied')}</h2>
                <p className="text-gray-600 dark:text-slate-300 mb-6">{t('adminPage.noPermission')}</p>
                <button
                onClick={() => { logout(); }}
                className="px-6 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90"
                >
                {t('adminPage.backToHome')}
                </button>
            </div>
        )
    }
    
    const renderSection = () => {
        if (!hasPermission(section)) {
            return (
               <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:border dark:border-slate-700">
                   <h2 className="text-2xl font-bold mb-4 text-red-600">{t('adminPage.accessDenied')}</h2>
                   <p className="text-gray-600 dark:text-slate-300 mb-6">{t('adminPage.noPermission')}</p>
               </div>
           )
        }

        switch (section) {
            case 'partners':
                return <PartnerManagement />;
            case 'partner-applications':
                return <PartnerApplicationsPage />;
            case 'services':
                return <ServiceManagement />;
            case 'users':
                return <UserManagement />;
            case 'orders':
                return <OrderManagement />;
            case 'drivers':
                return <DriverManagement />;
            case 'promotions':
                return <PromoManagement />;
            case 'advertisements':
                return <AdManagement />;
            case 'loyalty':
                return <LoyaltyManagement />;
            case 'referral':
                return <ReferralManagement />;
            case 'content':
                return <ContentManagement />;
            case 'support':
                return <SupportManagement />;
            case 'analytics':
                return <AdminAnalytics />;
            case 'adminManagement':
                return <AdminManagement />;
            case 'tracking':
                return <TrackingManagement />;
            case 'subscriptions':
                return <SubscriptionManagement />;
            case 'refunds':
                return <RefundManagement />;
            case 'activity':
                return <ActivityLogManagement />;
            case 'ops_dashboard':
                return <TruthDashboard />;
            case 'ops_truth':
                return <OrderTruthPage />;
            case 'ops_anomalies':
                return <AnomalyCenterPage />;
            case 'ops_investigate':
                return <InvestigatePage />;
            case 'dashboard':
            default:
                return <Dashboard setSection={setSection} />;
        }
    }
    
    const sidebar = <AdminSidebar activeSection={section} onSectionClick={setSection} />;

    return (
       <DashboardLayout sidebar={sidebar} mobileTitle={t(`adminPage.${section}`)}>
            <div key={section} className="animate-fade-in">
                {renderSection()}
            </div>
       </DashboardLayout>
    )
}
