import React from 'react';
import { Partner, UserRole, PartnerSection, PartnerFeatures } from '../../types';
import { Icon } from '../Icon';
import { useAppContext } from '../../context/AppContext';
import { Tooltip } from '../Tooltip';

const NavItem: React.FC<{
    target: PartnerSection;
    iconName: 'logo' | 'user' | 'shirt' | 'sparkles' | 'lifebuoy' | 'currencyDollar' | 'chartBar' | 'users' | 'shield-check' | 'code-bracket' | 'arrow-path' | 'star' | 'archive-box' | 'map' | 'truck' | 'document-text';
    label: string;
    isExternal?: boolean;
    isActive: boolean;
    badge?: number;
    onClick: (target: PartnerSection, isExternal?: boolean) => void;
}> = ({ target, iconName, label, isExternal = false, isActive, badge, onClick}) => {
    return (
        <button
            onClick={() => onClick(target, isExternal)}
            className={`flex w-full shrink-0 items-center rounded-lg px-4 py-3 text-left transition-colors ${isActive ? 'bg-brand-blue text-white' : 'text-content-primary hover:bg-surface-muted'}`}
        >
            <Icon name={iconName} className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-content-muted'}`} />
            <span className="font-medium whitespace-nowrap flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </button>
    );
};

interface PartnerSidebarProps {
    partner: Partner | null;
    activeSection: PartnerSection;
    onSectionClick: (target: PartnerSection, isExternal?: boolean) => void;
}

export const PartnerSidebar: React.FC<PartnerSidebarProps> = ({ partner, activeSection, onSectionClick }) => {
    const { user, t, appNotifications } = useAppContext();
    const { role } = user || {};

    const pendingOrdersBadge = appNotifications.filter(n => n.recipientId === user?.id && n.notificationType === 'newOrder' && !n.isRead).length;

    const navItems: {
        target: PartnerSection;
        icon: 'logo' | 'user' | 'shirt' | 'sparkles' | 'lifebuoy' | 'currencyDollar' | 'chartBar' | 'users' | 'shield-check' | 'code-bracket' | 'arrow-path' | 'star' | 'archive-box' | 'map' | 'truck' | 'document-text';
        label: string;
        roles: UserRole[];
        feature?: keyof Partner['enabledFeatures'];
        isExternal?: boolean;
        tooltip: string;
    }[] = [
        { target: 'dashboard', icon: 'logo', label: t('partnerDashboardPage.dashboard'), roles: ['partner-owner', 'partner-manager', 'partner-staff'], tooltip: t('tooltips.dashboard') },
        { target: 'analytics', icon: 'chartBar', label: t('partnerDashboardPage.analytics'), roles: ['partner-owner', 'partner-manager'], feature: 'analytics', tooltip: t('tooltips.analytics') },
        { target: 'orders', icon: 'shirt', label: t('partnerDashboardPage.orderManagement'), roles: ['partner-owner', 'partner-manager', 'partner-staff'], tooltip: t('tooltips.orders') },
        { target: 'invoicing', icon: 'document-text', label: t('partnerDashboardPage.invoicing'), roles: ['partner-owner', 'partner-manager'], feature: 'invoiceGenerator', tooltip: t('tooltips.invoicing') },
        { target: 'financials', icon: 'currencyDollar', label: t('partnerDashboardPage.financials'), roles: ['partner-owner'], feature: 'financials', tooltip: t('tooltips.financials') },
        { target: 'profile', icon: 'user', label: t('partnerDashboardPage.myProfile'), roles: ['partner-owner', 'partner-manager'], tooltip: t('tooltips.profile') },
        { target: 'inventory', icon: 'archive-box', label: t('partnerDashboardPage.inventory'), roles: ['partner-owner', 'partner-manager'], tooltip: t('tooltips.inventory') },
        { target: 'delivery', icon: 'truck', label: t('partnerDashboardPage.delivery'), roles: ['partner-owner'], tooltip: t('tooltips.delivery') },
        { target: 'promotions', icon: 'sparkles', label: t('partnerDashboardPage.promotions'), roles: ['partner-owner', 'partner-manager'], feature: 'promotions', tooltip: t('tooltips.promotions') },
        { target: 'subscription', icon: 'star', label: t('partnerDashboardPage.subscription', { default: "Subscription" }), roles: ['partner-owner'], tooltip: t('tooltips.subscription', { default: "Manage your subscription plan and billing."}) },
        { target: 'team', icon: 'users', label: t('partnerDashboardPage.teamManagement', { default: "Team Management" }), roles: ['partner-owner'], feature: 'teamManagement', tooltip: t('tooltips.team') },
        { target: 'security', icon: 'shield-check', label: t('partnerDashboardPage.security', { default: "Security" }), roles: ['partner-owner'], tooltip: t('tooltips.security') },
        { target: 'api-integrations', icon: 'code-bracket', label: t('partnerDashboardPage.apiIntegrations', { default: "API & Integrations" }), roles: ['partner-owner'], feature: 'apiAccess', tooltip: t('tooltips.apiIntegrations') },
        { target: 'automation', icon: 'arrow-path', label: t('partnerDashboardPage.automation', { default: "Automation" }), roles: ['partner-owner'], feature: 'advancedAutomation', tooltip: t('tooltips.automation') },
        { target: 'support', icon: 'lifebuoy', label: t('partnerDashboardPage.support'), roles: ['partner-owner', 'partner-manager', 'partner-staff'], isExternal: true, tooltip: t('tooltips.support') },
    ];

    return (
        <>
            <h2 className="mb-4 hidden px-2 text-xl font-bold text-content-primary md:block">{t('partnerDashboardPage.partnerMenu')}</h2>
            <nav className="flex flex-col gap-2">
                {navItems.map(item => {
                    const hasRequiredRole = role && item.roles.includes(role as UserRole);
                    // This logic was flawed. Correctly check against the partner's specific enabledFeatures.
                    const hasRequiredFeature = !item.feature || (partner?.enabledFeatures?.[item.feature] === true);

                    if (hasRequiredRole && hasRequiredFeature) {
                        return (
                            <Tooltip key={item.target} content={item.tooltip} position="right">
                                <NavItem 
                                    target={item.target as PartnerSection} 
                                    iconName={item.icon as any} 
                                    label={item.label} 
                                    isActive={activeSection === item.target} 
                                    badge={item.target === 'orders' ? pendingOrdersBadge : undefined}
                                    onClick={onSectionClick}
                                    isExternal={item.isExternal}
                                />
                            </Tooltip>
                        )
                    }
                    return null;
                })}
            </nav>
        </>
    );
};
