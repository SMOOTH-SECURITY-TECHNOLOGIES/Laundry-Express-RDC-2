

// FIX: The component implementation is consolidated here to resolve a filename casing conflict.
// This file is now the canonical source for the Admin Dashboard.
import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import { Order, OrderStatus, AdminSection, SecurityAlert, Partner, Service, StatCard as StatCardType } from '../../types';
import { Icon } from '../../components/Icon.tsx';
import { StatCard } from '../../components/StatCard.tsx';
// FIX: Using correct PascalCase for the implementation file import to resolve casing and export errors.
import { ChatModal } from '../../components/ChatModal';

interface DashboardProps {
    setSection: (section: AdminSection) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setSection }) => {
    const { partners, getAllOrders, getAllUsers, partnerApplications, supportTickets, t } = useAppContext();

    const stats = useMemo(() => {
        const allOrders = getAllOrders();
        const allUsers = getAllUsers();
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentOrders = allOrders.filter(o => new Date(o.createdAt) > thirtyDaysAgo);
        const revenue = recentOrders.filter(o => o.status === 'COMPLETED').reduce((sum, order) => sum + order.totalPrice, 0);

        return {
            totalPartners: partners.length,
            totalUsers: allUsers.length,
            totalOrders: recentOrders.length,
            totalRevenue: revenue.toFixed(2),
            pendingApplications: partnerApplications.length,
            openTickets: supportTickets.filter(t => t.status === 'OPEN').length,
        }
    }, [partners, getAllOrders, getAllUsers, partnerApplications, supportTickets]);

    const statCards: {title: string, value: string|number, iconName: StatCardType['iconName'], section: AdminSection}[] = [
        { title: t('adminDashboard.totalRevenue'), value: `${stats.totalRevenue} $`, iconName: 'currencyDollar', section: 'analytics' },
        { title: t('adminDashboard.totalOrders'), value: stats.totalOrders, iconName: 'shirt', section: 'orders' },
        { title: t('adminDashboard.totalPartners'), value: stats.totalPartners, iconName: 'wash', section: 'partners' },
        { title: t('adminDashboard.totalUsers'), value: stats.totalUsers, iconName: 'user', section: 'users' },
        { title: t('adminDashboard.pendingApplications'), value: stats.pendingApplications, iconName: 'pencil', section: 'partners' },
        { title: t('adminDashboard.openTickets'), value: stats.openTickets, iconName: 'lifebuoy', section: 'support' },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">{t('adminDashboard.title')}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map(stat => (
                    <button key={stat.title} onClick={() => setSection(stat.section)} className="text-left">
                        <StatCard title={stat.title} value={stat.value} iconName={stat.iconName} />
                    </button>
                ))}
            </div>
            {/* Can add charts or recent activity here later */}
        </div>
    );
};

export const ReassignPartnerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}> = ({ isOpen, onClose, order }) => {
// FIX: Add services to destructuring to pass to suggestReassignment.
    const { partners, services, reassignPartner, addNotification, t, suggestReassignment } = useAppContext();
    const [selectedPartnerId, setSelectedPartnerId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<{ suggestedPartnerId: string | null; justification: string; rankedOptions: Partner[] } | null>(null);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
// FIX: Pass partners and services to suggestReassignment.
            suggestReassignment(order, partners, services)
                .then(setSuggestion)
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, order, suggestReassignment, partners, services]);
    
    useEffect(() => {
        if (suggestion?.suggestedPartnerId) {
            setSelectedPartnerId(suggestion.suggestedPartnerId);
        }
    }, [suggestion]);
    
    const handleConfirm = async () => {
        if (!selectedPartnerId) return;
        setIsLoading(true);
        try {
            await reassignPartner(order.id, selectedPartnerId);
            addNotification("Order reassigned successfully", "success");
            onClose();
        } catch (e) {
            addNotification("Failed to reassign order", "error");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative">
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">{t('reassignModal.title', {id: order.id})}</h2>
                    
                    {isLoading && <p>{t('reassignModal.loading')}</p>}
                    
                    {!isLoading && suggestion && (
                        <div className="p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-lg mb-4">
                            <p className="font-semibold">{t('reassignModal.aiSuggestion')}</p>
                            <p className="text-sm">{suggestion.justification}</p>
                        </div>
                    )}

                    <select
                        value={selectedPartnerId}
                        onChange={e => setSelectedPartnerId(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white"
                    >
                        <option value="">{t('reassignModal.selectPartner')}</option>
                        {partners.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} - {p.address}
                            </option>
                        ))}
                    </select>
                    
                    <div className="flex justify-end space-x-2 mt-4">
                        <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-lg">{t('buttons.cancel')}</button>
                        <button onClick={handleConfirm} disabled={!selectedPartnerId || isLoading} className="px-4 py-2 bg-brand-success text-white rounded-lg disabled:bg-slate-400">
                            {isLoading ? t('buttons.loading') : t('reassignModal.confirmButton')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
