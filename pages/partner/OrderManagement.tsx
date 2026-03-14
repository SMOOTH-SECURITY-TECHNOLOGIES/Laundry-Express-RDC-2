

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import { Order, OrderStatus, User, UserRole } from '../../types';
// FIX: Using correct PascalCase for the implementation file import to resolve casing and export errors.
import { ChatModal } from '../../components/ChatModal';
import { Icon } from '../../components/Icon.tsx';
import { useNavigation } from '../../context/NavigationContext';

const getStatusColor = (status: OrderStatus) => {
    switch(status) {
        case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800';
        case OrderStatus.REJECTED: return 'bg-red-100 text-red-800';
        case OrderStatus.PROCESSING:
        case OrderStatus.DELIVERY:
        case OrderStatus.PICKUP:
            return 'bg-blue-100 text-blue-800';
        case OrderStatus.READY_FOR_PICKUP:
        case OrderStatus.READY_FOR_DELIVERY:
            return 'bg-orange-100 text-orange-800';
        default: return 'bg-yellow-100 text-yellow-800';
    }
}

const OrderRow: React.FC<{ order: Order; onOpenChat: (order: Order) => void; }> = ({ order, onOpenChat }) => {
    const { updateOrderStatus, getUserById, addNotification, t } = useAppContext();
    const driver = useMemo(() => order.driverId ? getUserById(order.driverId) : null, [order.driverId, getUserById]);
    const [isLoading, setIsLoading] = useState(false);
    
    const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
        if (currentStatus === OrderStatus.PICKUP) return OrderStatus.PROCESSING;
        if (currentStatus === OrderStatus.PROCESSING) return OrderStatus.READY_FOR_DELIVERY;
        if (currentStatus === OrderStatus.DELIVERY) return OrderStatus.COMPLETED;
        
        return null;
    };

    const nextStatus = getNextStatus(order.status);

    const nextStatusText = useMemo(() => {
        if (nextStatus) {
             const nextStatusKey = `orderStatus.${nextStatus}`;
            const nextStatusTranslation = t(nextStatusKey);
            return t('partnerOrderManagement.moveTo', { status: nextStatusTranslation });
        }
        return null;
    }, [nextStatus, t]);


    const handleStatusUpdate = async () => {
        if (nextStatus) {
            setIsLoading(true);
            try {
                await updateOrderStatus(order.id, nextStatus);
            } catch (error) {
                addNotification(t('partnerOrderManagement.statusUpdateError', { default: 'Erreur lors de la mise à jour du statut.' }), 'error');
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    const canChat = order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.REJECTED;

    return (
        <tr className="bg-white border-b hover:bg-slate-50">
            <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
            <td className="px-6 py-4 font-medium text-slate-900">
                <p>{order.clientDetails?.name}</p>
                {driver && (
                    <p className="text-xs text-slate-500 mt-1 font-normal flex items-center space-x-1">
                        <Icon name="truck" className="w-4 h-4 text-slate-400" />
                        <span>{t('partnerOrderManagement.assignedDriver')}: {driver.name} ({driver.vehicleInfo})</span>
                    </p>
                )}
            </td>
            <td className="px-6 py-4">{order.serviceItems.map(si => si.service.title).join(', ')}</td>
            <td className="px-6 py-4 font-semibold">${order.totalPrice.toFixed(2)}</td>
            <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {t(`orderStatus.${order.status}`)}
                </span>
            </td>
            <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
            <td className="px-6 py-4 space-x-2 flex items-center">
                {nextStatusText && (
                    <button 
                        onClick={handleStatusUpdate}
                        disabled={isLoading}
                        className="px-3 py-1 text-xs font-medium text-white bg-brand-blue rounded-lg hover:bg-opacity-90 disabled:bg-slate-400 disabled:cursor-wait min-w-[120px] text-center"
                    >
                        {isLoading ? t('buttons.loading') : nextStatusText}
                    </button>
                )}
                {canChat && (
                    <button
                        onClick={() => onOpenChat(order)}
                        className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"
                        title={t('partnerOrderManagement.openChat')}
                    >
                       <Icon name="chatBubble" className="w-5 h-5"/>
                    </button>
                )}
            </td>
        </tr>
    );
};

export const OrderManagement: React.FC = () => {
    const { user, getOrdersForPartner, updateOrderStatus, getUserById, addNotification, t } = useAppContext();
    const { openChatForOrderId, setOpenChatForOrderId } = useNavigation();
    const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
    const [chattingOrder, setChattingOrder] = useState<Order | null>(null);
    
    const partnerOrders = useMemo(() => {
        if (!user?.partnerId) return [];
        const all = getOrdersForPartner(user.partnerId);
        return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [user, getOrdersForPartner]);

    useEffect(() => {
        if (openChatForOrderId) {
            const orderToOpen = partnerOrders.find(o => o.id === openChatForOrderId);
            if (orderToOpen) {
                setChattingOrder(orderToOpen);
                setOpenChatForOrderId(null); // Reset state
            }
        }
    }, [openChatForOrderId, partnerOrders, setOpenChatForOrderId]);

    const filteredOrders = filter === 'all' 
        ? partnerOrders 
        : partnerOrders.filter(o => o.status === filter);

    return (
        <>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">{t('partnerOrderManagement.title')}</h1>
                <div className="bg-white p-6 rounded-2xl shadow-card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">{t('partnerOrderManagement.myOrders', { count: filteredOrders.length })}</h2>
                        <div>
                            <label htmlFor="statusFilter" className="text-sm font-medium mr-2">{t('partnerOrderManagement.filterByStatus')}</label>
                            <select 
                                id="statusFilter"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as OrderStatus | 'all')}
                                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                            >
                                <option value="all">{t('partnerOrderManagement.all')}</option>
                                {Object.values(OrderStatus).map(status => (
                                    <option key={status} value={status}>{t(`orderStatus.${status}`)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="space-y-4 md:hidden">
                        {filteredOrders.map(order => (
                            <OrderCard key={order.id} order={order} onOpenChat={setChattingOrder} updateOrderStatus={updateOrderStatus} getUserById={getUserById} addNotification={addNotification} t={t} />
                        ))}
                    </div>
                    
                    {/* Desktop Table View */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('partnerOrderManagement.orderId')}</th>
                                    <th scope="col" className="px-6 py-3">{t('partnerOrderManagement.customer')}</th>
                                    <th scope="col" className="px-6 py-3">{t('partnerOrderManagement.service')}</th>
                                    <th scope="col" className="px-6 py-3">{t('partnerOrderManagement.total')}</th>
                                    <th scope="col" className="px-6 py-3">{t('partnerOrderManagement.status')}</th>
                                    <th scope="col" className="px-6 py-3">{t('partnerOrderManagement.date')}</th>
                                    <th scope="col" className="px-6 py-3">{t('partnerOrderManagement.action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order: Order) => (
                                    <OrderRow key={order.id} order={order} onOpenChat={setChattingOrder} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredOrders.length === 0 && (
                        <p className="text-center text-slate-500 py-8">{t('partnerOrderManagement.noOrdersForFilter')}</p>
                    )}
                </div>
            </div>
            <ChatModal
                isOpen={!!chattingOrder}
                onClose={() => setChattingOrder(null)}
                order={chattingOrder}
            />
        </>
    );
};

// New Card component for mobile view
const OrderCard: React.FC<{
    order: Order;
    onOpenChat: (order: Order) => void;
    updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
    getUserById: (userId: string) => User | undefined;
    addNotification: (message: string, type: 'success' | 'info' | 'error') => void;
    t: (key: string, options?: any) => string;
}> = ({ order, onOpenChat, updateOrderStatus, getUserById, addNotification, t }) => {
    const driver = useMemo(() => order.driverId ? getUserById(order.driverId) : null, [order.driverId, getUserById]);
    const [isLoading, setIsLoading] = useState(false);
    
    const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
        if (currentStatus === OrderStatus.PICKUP) return OrderStatus.PROCESSING;
        if (currentStatus === OrderStatus.PROCESSING) return OrderStatus.READY_FOR_DELIVERY;
        if (currentStatus === OrderStatus.DELIVERY) return OrderStatus.COMPLETED;
        return null;
    };

    const nextStatus = getNextStatus(order.status);

    const nextStatusText = useMemo(() => {
        if (nextStatus) {
            const nextStatusKey = `orderStatus.${nextStatus}`;
            const nextStatusTranslation = t(nextStatusKey);
            return t('partnerOrderManagement.moveTo', { status: nextStatusTranslation });
        }
        return null;
    }, [nextStatus, t]);

    const handleStatusUpdate = async () => {
        if (nextStatus) {
            setIsLoading(true);
            try {
                await updateOrderStatus(order.id, nextStatus);
            } catch (error) {
                addNotification(t('partnerOrderManagement.statusUpdateError'), 'error');
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    const canChat = order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.REJECTED;

    return (
        <div className="p-4 bg-slate-50 border rounded-lg">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-slate-900">{order.clientDetails?.name}</p>
                    <p className="text-sm font-mono text-slate-500">{order.id}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {t(`orderStatus.${order.status}`)}
                </span>
            </div>
            <div className="mt-2 pt-2 border-t text-sm space-y-1">
                <p><strong>{t('partnerOrderManagement.service')}:</strong> {order.serviceItems.map(si => si.service.title).join(', ')}</p>
                <p><strong>{t('partnerOrderManagement.total')}:</strong> <span className="font-semibold">${order.totalPrice.toFixed(2)}</span></p>
                <p><strong>{t('partnerOrderManagement.date')}:</strong> {new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                {driver && (
                    <p className="flex items-center space-x-1">
                        <Icon name="truck" className="w-4 h-4 text-slate-400" />
                        <span><strong>{t('partnerOrderManagement.assignedDriver')}:</strong> {driver.name} ({driver.vehicleInfo})</span>
                    </p>
                )}
            </div>
            <div className="mt-2 pt-2 border-t flex justify-end items-center space-x-2">
                {canChat && (
                    <button onClick={() => onOpenChat(order)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-full" title={t('partnerOrderManagement.openChat')}>
                        <Icon name="chatBubble" className="w-5 h-5"/>
                    </button>
                )}
                {nextStatusText && (
                    <button onClick={handleStatusUpdate} disabled={isLoading} className="px-3 py-1.5 text-xs font-medium text-white bg-brand-blue rounded-lg hover:bg-opacity-90 disabled:bg-slate-400">
                        {isLoading ? t('buttons.loading') : nextStatusText}
                    </button>
                )}
            </div>
        </div>
    );
};
