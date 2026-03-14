import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { BarChart } from '../../components/BarChart';
import { StatCard } from '../../components/StatCard';
import { Icon } from '../../components/Icon';

const PayoutStatus: React.FC<{ orderDate: string }> = ({ orderDate }) => {
    const { t } = useAppContext();

    const status = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (new Date(orderDate) < sevenDaysAgo) {
            return { text: t('partnerFinancials.payoutStatus.paidOut'), color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' };
        }
        return { text: t('partnerFinancials.payoutStatus.pending'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' };
    }, [orderDate, t]);
    
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
            {status.text}
        </span>
    );
};

export const Financials: React.FC = () => {
    const { user, getOrdersForPartner, t, formatPrice } = useAppContext();

    const completedOrders = useMemo(() => {
        if (!user?.partnerId) return [];
        return getOrdersForPartner(user.partnerId)
            .filter(o => o.status === OrderStatus.COMPLETED)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [user, getOrdersForPartner]);

    const { stats, dailyRevenueChartData } = useMemo(() => {
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentCompletedOrders = completedOrders.filter(
          o => new Date(o.createdAt).getTime() >= thirtyDaysAgo.getTime()
        );

        const revenueLast30Days = recentCompletedOrders.reduce((sum, order) => sum + order.totalPrice, 0);

        const dailyRevenueData = recentCompletedOrders.reduce((acc, order) => {
          const date = new Date(order.createdAt).toLocaleDateString('fr-CA'); // YYYY-MM-DD
          acc[date] = (acc[date] || 0) + order.totalPrice;
          return acc;
        }, {} as { [key: string]: number });

        const chartData = Array.from({ length: 30 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = d.toLocaleDateString('fr-CA');
            return {
                label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
                value: dailyRevenueData[dateKey] || 0,
            };
        }).reverse();
        
        return {
            stats: {
                totalRevenue,
                revenueLast30Days,
                avgOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
                completedOrdersCount: completedOrders.length,
            },
            dailyRevenueChartData: chartData
        };
    }, [completedOrders]);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">{t('partnerFinancials.title')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('partnerFinancials.totalRevenue')} value={formatPrice(stats.totalRevenue)} iconName="currencyDollar" />
                <StatCard title={t('partnerFinancials.revenueLast30Days')} value={formatPrice(stats.revenueLast30Days)} iconName="calendar" />
                <StatCard title={t('partnerFinancials.completedOrders')} value={stats.completedOrdersCount} iconName="check" />
                <StatCard title={t('partnerFinancials.avgOrderValue')} value={formatPrice(stats.avgOrderValue)} iconName="sparkles" />
            </div>

            <BarChart data={dailyRevenueChartData} title={t('partnerFinancials.revenueChartTitle')} valueFormatter={formatPrice} />

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <h2 className="text-2xl font-bold mb-4">{t('partnerFinancials.transactionHistoryTitle', { default: 'Transaction History'})}</h2>
                
                <div className="space-y-4 md:hidden">
                    {completedOrders.map(order => (
                        <div key={order.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-700 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{order.serviceItems.map(si => si.service.title).join(', ')}</p>
                                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{order.id}</p>
                                </div>
                                <p className="font-bold text-lg text-brand-success">{formatPrice(order.totalPrice)}</p>
                            </div>
                            <div className="mt-2 pt-2 border-t dark:border-slate-600 flex justify-between items-center text-sm">
                                <p className="text-slate-500 dark:text-slate-400">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                                <PayoutStatus orderDate={order.createdAt} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('partnerFinancials.table.orderId')}</th>
                                <th scope="col" className="px-6 py-3">{t('partnerFinancials.table.completionDate')}</th>
                                <th scope="col" className="px-6 py-3">{t('partnerFinancials.table.service')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('partnerFinancials.table.amount')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('partnerFinancials.table.payoutStatus')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {completedOrders.map(order => (
                                    <tr key={order.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
                                        <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">{order.serviceItems.map(si => si.service.title).join(', ')}</td>
                                        <td className="px-6 py-4 font-semibold text-right text-brand-success">{formatPrice(order.totalPrice)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <PayoutStatus orderDate={order.createdAt} />
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
                {completedOrders.length === 0 && (
                    <div className="text-center py-12">
                         <Icon name="currencyDollar" className="mx-auto h-12 w-12 text-slate-300" />
                        <p className="mt-4 font-semibold text-slate-600 dark:text-slate-300">{t('partnerFinancials.noTransactions')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};