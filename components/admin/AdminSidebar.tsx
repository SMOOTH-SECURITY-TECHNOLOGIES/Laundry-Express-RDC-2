import React from 'react';
import { Icon } from '../Icon';
import { AdminSection } from '../../types';
import { useAppContext } from '../../context/AppContext';

const NavItem: React.FC<{
    target: AdminSection;
    iconName: 'logo' | 'user' | 'wash' | 'shirt' | 'sparkles' | 'pencil' | 'lifebuoy' | 'truck' | 'star' | 'chartBar' | 'device-phone-mobile' | 'list' | 'code-bracket' | 'shield-check' | 'exclamation-circle' | 'clock-history' | 'shield' | 'search' | 'warning' | 'document-text';
    label: string;
    isActive: boolean;
    onClick: (target: AdminSection) => void;
}> = ({ target, iconName, label, isActive, onClick }) => {
    return (
        <button
            onClick={() => onClick(target)}
            className={`flex items-center w-full shrink-0 px-4 py-3 rounded-lg text-left transition-colors ${isActive ? 'bg-brand-blue text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`}
        >
            <Icon name={iconName} className="w-6 h-6 mr-3" />
            <span className="font-medium whitespace-nowrap">{label}</span>
        </button>
    );
};

interface AdminSidebarProps {
    activeSection: AdminSection;
    onSectionClick: (section: AdminSection) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeSection, onSectionClick }) => {
    const { user, t } = useAppContext();

    const hasPermission = (section: AdminSection): boolean => {
        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return false;
        if (user.role === 'superadmin') return true;
        return user.permissions?.includes(section) ?? false;
    };

    const navItems: { target: AdminSection, icon: 'logo' | 'user' | 'wash' | 'shirt' | 'sparkles' | 'pencil' | 'lifebuoy' | 'truck' | 'star' | 'chartBar' | 'device-phone-mobile' | 'list' | 'code-bracket' | 'shield-check' | 'exclamation-circle' | 'clock-history' | 'shield' | 'search' | 'warning' | 'document-text', label: string, permission: AdminSection }[] = [
        { target: 'dashboard', icon: 'logo', label: t('adminPage.dashboard'), permission: 'dashboard' },
        { target: 'analytics', icon: 'chartBar', label: t('adminPage.analytics'), permission: 'analytics' },
        { target: 'partners', icon: 'wash', label: t('adminPage.partners'), permission: 'partners' },
        { target: 'partner-applications', icon: 'document-text', label: 'Candidatures', permission: 'partners' },
        { target: 'services', icon: 'list', label: t('adminPage.services', { default: 'Services' }), permission: 'services' },
        { target: 'subscriptions', icon: 'shield-check', label: t('adminPage.subscriptions', { default: 'Subscriptions' }), permission: 'subscriptions' },
        { target: 'users', icon: 'user', label: t('adminPage.users'), permission: 'users' },
        { target: 'orders', icon: 'shirt', label: t('adminPage.orders'), permission: 'orders' },
        { target: 'refunds', icon: 'exclamation-circle', label: t('adminPage.refunds', { default: 'Refunds' }), permission: 'refunds' },
        { target: 'drivers', icon: 'truck', label: t('adminPage.drivers'), permission: 'drivers' },
        { target: 'promotions', icon: 'sparkles', label: t('adminPage.promotions'), permission: 'promotions' },
        { target: 'advertisements', icon: 'device-phone-mobile', label: t('adminPage.advertisements', { default: 'Ads' }), permission: 'advertisements' },
        { target: 'loyalty', icon: 'star', label: t('adminPage.loyalty'), permission: 'loyalty' },
        { target: 'referral', icon: 'user', label: t('adminPage.referral'), permission: 'referral' },
        { target: 'content', icon: 'pencil', label: t('adminPage.contentManagement'), permission: 'content' },
        { target: 'support', icon: 'lifebuoy', label: t('adminPage.support'), permission: 'support' },
        { target: 'tracking', icon: 'code-bracket', label: t('adminPage.tracking', { default: 'Tracking' }), permission: 'tracking' },
        { target: 'adminManagement', icon: 'user', label: t('adminPage.adminManagement'), permission: 'adminManagement' },
        { target: 'activity', icon: 'clock-history', label: t('adminPage.activity', { default: 'Activity Log' }), permission: 'activity' },
        { target: 'ops_dashboard', icon: 'shield', label: 'Truth Dashboard', permission: 'ops_dashboard' },
        { target: 'ops_truth', icon: 'search', label: 'Order Truth', permission: 'ops_truth' },
        { target: 'ops_anomalies', icon: 'warning', label: 'Anomalies', permission: 'ops_anomalies' },
        { target: 'ops_investigate', icon: 'search', label: 'Investigate', permission: 'ops_investigate' },
    ];

    return (
        <>
            <h2 className="text-xl font-bold mb-4 px-2 hidden md:block">{t('adminPage.adminMenu')}</h2>
            <nav className="flex flex-col gap-2">
                {navItems.map(item =>
                    hasPermission(item.permission) && (
                        <NavItem
                            key={item.target}
                            target={item.target}
                            iconName={item.icon}
                            label={item.label}
                            isActive={activeSection === item.target}
                            onClick={onSectionClick}
                        />
                    )
                )}
            </nav>
        </>
    );
};