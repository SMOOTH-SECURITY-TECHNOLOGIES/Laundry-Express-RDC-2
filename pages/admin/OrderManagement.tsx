

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import { Order, OrderStatus } from '../../types';
// FIX: Using correct PascalCase for the implementation file import to resolve casing and export errors.
import { ChatModal } from '../../components/ChatModal';
import { Icon } from '../../components/Icon';
import { useNavigation } from '../../context/NavigationContext';

const getStatusColor = (status: OrderStatus) => {
    switch(status) {
        case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800';
        case OrderStatus.REJECTED: return 'bg-red-100 text-red-800';
        case OrderStatus.PROCESSING:
        case OrderStatus.DELIVERY:
        case OrderStatus.PICKUP:
            return 'bg-blue-100 text-blue-800';
        default: return 'bg-yellow-100 text-yellow-800';
    }
}

export const OrderManagement: React.FC = () => {
    const { getAllOrders, getAllUsers, t } = useAppContext();
    const { openChatForOrderId, setOpenChatForOrderId } = useNavigation();
    const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
    const [chattingOrder, setChattingOrder] = useState<Order | null>(null);

    const orders = getAllOrders();
    const users = getAllUsers();

    useEffect(() => {
        if (openChatForOrderId) {
            const orderToOpen = orders.find(o => o.id === openChatForOrderId);
            if (orderToOpen) {
                setChattingOrder(orderToOpen);
                setOpenChatForOrderId(null);
            }
        }
    }, [openChatForOrderId, orders, setOpenChatForOrderId]);

    const filteredOrders = filter === 'all' 
        ? orders 
        : orders.filter(o => o.status === filter);

    const getUserName = (userId: string) => {
        if (userId === 'guest') return t('orderManagement.guest');
        return users.find(u => u.id === userId)?.name || t('orderManagement.unknownUser');
    };

    return (
        <>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">{t('orderManagement.title')}</h1>
                <div className="bg-white p-6 rounded-2xl shadow-card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">{t('orderManagement.allOrders', { count: filteredOrders.length })}</h2>
                        <div>
                            <label htmlFor="statusFilter" className="text-sm font-medium mr-2">{t('orderManagement.filterByStatus')}</label>
                            <select 
                                id="statusFilter"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as OrderStatus | 'all')}
                                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                            >
                                <option value="all">{t('orderManagement.all')}</option>
                                {Object.values(OrderStatus).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="space-y-4 md:hidden">
                        {filteredOrders.map((order: Order) => {
                            const canChat = order.status !== OrderStatus.AWAITING_CONFIRMATION;
                            return (
                                <div key={order.id} className="p-4 bg-slate-50 border rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-900">{t('adminOrderManagement.customer')}: {getUserName(order.userId)}</p>
                                            <p className="text-sm font-mono text-slate-500">{order.id}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t text-sm space-y-1">
                                        <p><strong>{t('adminOrderManagement.partner')}:</strong> {order.partner?.name}</p>
                                        <p><strong>{t('adminOrderManagement.total')}:</strong> <span className="font-semibold">${order.totalPrice.toFixed(2)}</span></p>
                                        <p><strong>{t('adminOrderManagement.date')}:</strong> {new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                    {canChat && (
                                        <div className="mt-2 pt-2 border-t flex justify-end">
                                            <button
                                                onClick={() => setChattingOrder(order)}
                                                className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"
                                                title={t('orderManagement.openChat')}
                                            >
                                                <Icon name="chatBubble" className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Desktop Table View */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('orderManagement.orderId')}</th>
                                    <th scope="col" className="px-6 py-3">{t('orderManagement.customer')}</th>
                                    <th scope="col" className="px-6 py-3">{t('orderManagement.partner')}</th>
                                    <th scope="col" className="px-6 py-3">{t('orderManagement.total')}</th>
                                    <th scope="col" className="px-6 py-3">{t('orderManagement.status')}</th>
                                    <th scope="col" className="px-6 py-3">{t('orderManagement.date')}</th>
                                    <th scope="col" className="px-6 py-3">{t('orderManagement.chat')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order: Order) => {
                                    const canChat = order.status !== OrderStatus.AWAITING_CONFIRMATION;
                                    return (
                                        <tr key={order.id} className="bg-white border-b hover:bg-slate-50">
                                            <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{getUserName(order.userId)}</td>
                                            <td className="px-6 py-4">{order.partner?.name}</td>
                                            <td className="px-6 py-4 font-semibold">${order.totalPrice.toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
                                            <td className="px-6 py-4">
                                                {canChat ? (
                                                     <button
                                                        onClick={() => setChattingOrder(order)}
                                                        className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"
                                                        title={t('orderManagement.openChat')}
                                                    >
                                                        <Icon name="chatBubble" className="w-5 h-5"/>
                                                    </button>
                                                ) : (
                                                    <span>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filteredOrders.length === 0 && (
                        <p className="text-center text-slate-500 py-8">{t('orderManagement.noOrdersForFilter')}</p>
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
