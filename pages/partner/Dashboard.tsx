

import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import { Order, OrderStatus, Review, Partner, PartnerSection } from '../../types.ts';
import { Icon } from '../../components/Icon.tsx';
import { StatCard } from '../../components/StatCard.tsx';
// FIX: Using correct PascalCase for the implementation file import to resolve casing and export errors.
import { ChatModal } from '../../components/ChatModal';
import { OnboardingChecklist } from '../../components/partner/OnboardingChecklist.tsx';
import { OrderDetailsModal } from '../../components/partner/OrderDetailsModal.tsx';

interface DashboardProps {
    setSection: (section: PartnerSection) => void;
}

export const EstimateTimeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (estimatedTime: string) => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const { t } = useAppContext();
  const [selectedOption, setSelectedOption] = useState<string>('24');
  
  if (!isOpen) return null;

  const handleConfirm = () => {
    const hours = parseInt(selectedOption, 10);
    const date = new Date();
    date.setHours(date.getHours() + hours);
    const timeStr = date.toLocaleString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });
    onConfirm(timeStr);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-slide-up">
        <h2 className="text-xl font-bold mb-4">{t('estimateTimeModal.title')}</h2>
        <select 
          value={selectedOption} 
          onChange={(e) => setSelectedOption(e.target.value)}
          className="w-full p-2 border rounded mb-6 dark:bg-slate-700 dark:border-slate-600"
        >
          <option value="12">12 {t('partnerDashboard.hours', { default: 'hours' })}</option>
          <option value="24">24 {t('partnerDashboard.hours', { default: 'hours' })}</option>
          <option value="48">48 {t('partnerDashboard.hours', { default: 'hours' })}</option>
          <option value="72">72 {t('partnerDashboard.hours', { default: 'hours' })}</option>
        </select>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400">{t('buttons.cancel')}</button>
          <button 
            onClick={handleConfirm} 
            disabled={isLoading}
            className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-dark"
          >
            {isLoading ? t('buttons.loading') : t('estimateTimeModal.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ setSection }) => {
    const { user, partners, getOrdersForPartner, updateOrderStatus, addNotification, t, formatPrice } = useAppContext();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [chattingOrder, setChattingOrder] = useState<Order | null>(null);

    const partner = useMemo(() => partners.find(p => p.id === user?.partnerId), [partners, user]);
    
    const partnerOrders = useMemo(() => {
        if (!user?.partnerId) return [];
        return getOrdersForPartner(user.partnerId);
    }, [user, getOrdersForPartner]);

    const stats = useMemo(() => {
        const completed = partnerOrders.filter(o => o.status === OrderStatus.COMPLETED);
        const revenue = completed.reduce((sum, o) => sum + o.totalPrice, 0);
        return {
            newOrders: partnerOrders.filter(o => o.status === OrderStatus.AWAITING_CONFIRMATION).length,
            activeOrders: partnerOrders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.REJECTED).length,
            revenueThisMonth: revenue,
            avgOrder: completed.length > 0 ? revenue / completed.length : 0
        };
    }, [partnerOrders]);

    const handleAcceptOrder = (order: Order) => {
        setSelectedOrder(order);
        setIsTimeModalOpen(true);
    };

    const handleConfirmTime = async (estimatedTime: string) => {
        if (!selectedOrder) return;
        setIsUpdating(true);
        try {
            await updateOrderStatus(selectedOrder.id, OrderStatus.READY_FOR_PICKUP, undefined, estimatedTime);
            addNotification(t('partnerDashboard.orderAcceptedNotification'), 'success');
            setIsTimeModalOpen(false);
            setIsOrderModalOpen(false);
        } catch (error) {
            addNotification(t('partnerDashboard.orderUpdateError'), 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRejectOrder = async (orderId: string) => {
        const reason = prompt(t('partnerDashboard.rejectionReasonPrompt'));
        if (reason !== null) {
            setIsUpdating(true);
            try {
                await updateOrderStatus(orderId, OrderStatus.REJECTED, reason || t('partnerDashboard.defaultRejectionReason'));
                setIsOrderModalOpen(false);
            } catch (error) {
                addNotification(t('partnerDashboard.orderUpdateError'), 'error');
            } finally {
                setIsUpdating(false);
            }
        }
    };

    if (!partner) return null;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl sm:text-3xl font-bold dark:text-slate-100">{t('partnerDashboard.title', { name: partner.name })}</h1>
            </div>

            <OnboardingChecklist partner={partner} onNavigate={(sec) => setSection(sec as any)} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('partnerDashboard.pendingNewOrders', { count: stats.newOrders })} value={stats.newOrders} iconName="bell" />
                <StatCard title={t('partnerDashboard.activeOrders')} value={stats.activeOrders} iconName="shirt" />
                <StatCard title={t('partnerDashboard.revenueThisMonth')} value={formatPrice(stats.revenueThisMonth)} iconName="currencyDollar" />
                <StatCard title={t('partnerDashboard.avgOrderValue')} value={formatPrice(stats.avgOrder)} iconName="sparkles" />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <h2 className="text-xl font-bold mb-4 dark:text-slate-100">{t('partnerDashboard.newOrders')}</h2>
                <div className="space-y-4">
                    {partnerOrders.filter(o => o.status === OrderStatus.AWAITING_CONFIRMATION).map(order => (
                        <div key={order.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-100">{order.clientDetails?.name}</p>
                                <p className="text-sm text-slate-500">{order.serviceItems.map(si => si.service.title).join(', ')}</p>
                            </div>
                            <div className="flex space-x-2 w-full sm:w-auto">
                                <button onClick={() => { setSelectedOrder(order); setIsOrderModalOpen(true); }} className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg shadow-sm">{t('partnerDashboard.viewDetails')}</button>
                                <button onClick={() => handleAcceptOrder(order)} className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold bg-brand-blue text-white rounded-lg shadow-sm hover:bg-brand-dark transition-colors">{t('partnerDashboard.confirm')}</button>
                            </div>
                        </div>
                    ))}
                    {stats.newOrders === 0 && (
                        <p className="text-center py-8 text-slate-500">{t('partnerDashboard.noNewOrders')}</p>
                    )}
                </div>
            </div>
            
            <ChatModal isOpen={!!chattingOrder} onClose={() => setChattingOrder(null)} order={chattingOrder} />
            
            <OrderDetailsModal 
                isOpen={isOrderModalOpen} 
                onClose={() => setIsOrderModalOpen(false)} 
                order={selectedOrder}
                onConfirm={handleAcceptOrder}
                onReject={handleRejectOrder}
                onOpenChat={setChattingOrder}
            />

            <EstimateTimeModal
                isOpen={isTimeModalOpen}
                onClose={() => setIsTimeModalOpen(false)}
                onConfirm={handleConfirmTime}
                isLoading={isUpdating}
            />
        </div>
    );
};
