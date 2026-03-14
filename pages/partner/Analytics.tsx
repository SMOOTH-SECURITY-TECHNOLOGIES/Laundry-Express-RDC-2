import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order, OrderStatus, PromoCode } from '../../types';
import { BarChart } from '../../components/BarChart';
import { StatCard } from '../../components/StatCard';
import { Icon } from '../../components/Icon';

type TimeRange = 'week' | 'month' | 'year';

export const Analytics: React.FC = () => {
    const { user, getOrdersForPartner, getAllUsers, promoCodes, t, language } = useAppContext();
    const [timeRange, setTimeRange] = useState<TimeRange>('month');

    const partnerOrders = useMemo(() => {
        if (!user?.partnerId) return [];
        return getOrdersForPartner(user.partnerId);
    }, [user, getOrdersForPartner]);

    const completedOrders = useMemo(() => {
        return partnerOrders.filter(o => o.status === OrderStatus.COMPLETED)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [partnerOrders]);
    
    const filteredCompletedOrders = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        if (timeRange === 'week') startDate.setDate(now.getDate() - 7);
        if (timeRange === 'month') startDate.setMonth(now.getMonth() - 1);
        if (timeRange === 'year') startDate.setFullYear(now.getFullYear(), 0, 1);
        startDate.setHours(0,0,0,0);
        
        return completedOrders.filter(o => new Date(o.createdAt) >= startDate);
    }, [completedOrders, timeRange]);


    const { stats, revenueChartData, popularServices, customerData, topClients } = useMemo(() => {
        const totalRevenue = filteredCompletedOrders.reduce((sum: number, order: Order) => sum + order.totalPrice, 0);
        const ordersThisMonth = completedOrders.filter(o => new Date(o.createdAt).getMonth() === new Date().getMonth()).length;

        const chartData = filteredCompletedOrders.reduce((acc: { [key: string]: number }, order: Order) => {
            const date = new Date(order.createdAt).toLocaleDateString('fr-CA');
            acc[date] = (acc[date] || 0) + order.totalPrice;
            return acc;
        }, {} as { [key: string]: number });
        
        const chartLabels = Object.keys(chartData).sort();
        const revenueData = chartLabels.map(label => ({ label: new Date(label).toLocaleDateString(language, {day: 'numeric', month: 'short'}), value: chartData[label] }));

        const services = completedOrders.reduce((acc: { [key: string]: number }, order: Order) => {
            order.serviceItems.forEach(si => {
                if(si.service.title) {
                    acc[si.service.title] = (acc[si.service.title] || 0) + 1;
                }
            });
            return acc;
        }, {} as {[key: string]: number});
        const sortedServices = Object.entries(services).sort((a,b) => Number(b[1]) - Number(a[1])).slice(0, 5);

        const customerOrderCounts = partnerOrders.reduce((acc: { [key: string]: number }, order: Order) => {
            if(order.userId !== 'guest') {
                acc[order.userId] = (acc[order.userId] || 0) + 1;
            }
            return acc;
        }, {} as {[key: string]: number});

        const newCustomers = Object.values(customerOrderCounts).filter(c => c === 1).length;
        const returningCustomers = Object.keys(customerOrderCounts).length - newCustomers;
        
        const allUsers = getAllUsers();
        const clients = Object.entries(customerOrderCounts).sort((a,b) => Number(b[1]) - Number(a[1])).slice(0,5).map(([userId, count]) => {
            const clientUser = allUsers.find(u => u.id === userId);
            return { name: clientUser?.name || t('partnerAnalytics.unknownClient'), orders: count };
        });

        return {
            stats: {
                totalRevenue,
                avgOrderValue: filteredCompletedOrders.length > 0 ? totalRevenue / filteredCompletedOrders.length : 0,
                ordersThisMonth,
            },
            revenueChartData: revenueData,
            popularServices: sortedServices,
            customerData: { new: newCustomers, returning: returningCustomers },
            topClients: clients,
        };
    }, [filteredCompletedOrders, completedOrders, partnerOrders, getAllUsers, t, language]);

    const { topPromosByUsage, topPromosByRevenue } = useMemo(() => {
        if (!user?.partnerId) return { topPromosByUsage: [], topPromosByRevenue: [] };

        const partnerPromoCodes = promoCodes.filter(p => p.partnerId === user.partnerId);
        if (partnerPromoCodes.length === 0) return { topPromosByUsage: [], topPromosByRevenue: [] };

        const sortedByUsage = [...partnerPromoCodes]
            .filter(p => (p.usageCount || 0) > 0)
            .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
            .slice(0, 5);
        
        const promoRevenue: { [code: string]: { promo: PromoCode, revenue: number } } = {};
        partnerPromoCodes.forEach(p => {
            promoRevenue[p.code] = { promo: p, revenue: 0 };
        });

        completedOrders.forEach(order => {
            if (order.appliedPromoCode && promoRevenue[order.appliedPromoCode]) {
                promoRevenue[order.appliedPromoCode].revenue += order.totalPrice;
            }
        });

        const sortedByRevenue = Object.values(promoRevenue)
            .filter(p => p.revenue > 0)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return { topPromosByUsage: sortedByUsage, topPromosByRevenue: sortedByRevenue };
    }, [completedOrders, promoCodes, user]);
    
    const handleExport = () => {
        if (completedOrders.length === 0) {
            return;
        }

        const headers = [
            "Order ID", "Completion Date", "Service(s)", 
            "Subtotal", "Discount", "Total Paid", "Client Name", "Client Phone"
        ];

        const csvRows = [headers.join(',')];

        completedOrders.forEach(order => {
            const subtotal = order.totalPrice + (order.discountAmount || 0);
            const row = [
                order.id,
                new Date(order.createdAt).toISOString(),
                `"${order.serviceItems.map(si => si.service.title).join(' | ')}"`,
                subtotal.toFixed(2),
                (order.discountAmount || 0).toFixed(2),
                order.totalPrice.toFixed(2),
                `"${order.clientDetails?.name || 'N/A'}"`,
                order.clientDetails?.phone || 'N/A'
            ].join(',');
            csvRows.push(row);
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `laundry-express-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{t('partnerAnalytics.title')}</h1>
                <button
                    onClick={handleExport}
                    disabled={completedOrders.length === 0}
                    className="px-4 py-2 bg-brand-dark text-white font-semibold rounded-lg hover:bg-opacity-90 flex items-center space-x-2 disabled:bg-slate-400"
                >
                    <Icon name="arrow-down-tray" className="w-5 h-5"/>
                    <span>{t('partnerAnalytics.exportData')}</span>
                </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold dark:text-slate-100">{t('partnerAnalytics.revenueOverview')}</h2>
                    <div className="flex p-1 rounded-full bg-slate-100 dark:bg-slate-700">
                        {(['week', 'month', 'year'] as TimeRange[]).map(range => (
                            <button 
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 text-sm font-semibold rounded-full ${timeRange === range ? 'bg-white text-brand-blue shadow-sm dark:bg-slate-900' : 'text-slate-600 dark:text-slate-300'}`}
                            >
                                {t(`partnerAnalytics.timeRange.${range}`)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title={t('partnerAnalytics.totalRevenue')} value={`${stats.totalRevenue.toFixed(2)} $`} iconName="currencyDollar" />
                    <StatCard title={t('partnerAnalytics.avgOrderValue')} value={`${stats.avgOrderValue.toFixed(2)} $`} iconName="sparkles" />
                    <StatCard title={t('partnerAnalytics.ordersThisMonth')} value={stats.ordersThisMonth} iconName="shirt" />
                </div>
                {filteredCompletedOrders.length > 0 ? (
                    <BarChart data={revenueChartData} title={t('partnerAnalytics.revenueChartTitle')} />
                ) : <p className="text-center text-slate-500 py-12">{t('partnerAnalytics.noRevenueData')}</p>}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">{t('partnerAnalytics.promotionPerformance')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-semibold dark:text-slate-200">{t('partnerAnalytics.topPromosByUsage')}</h3>
                        {topPromosByUsage.length > 0 ? (
                            <ul className="space-y-2 mt-2">
                            {topPromosByUsage.map(promo => (
                                <li key={promo.id} className="flex justify-between text-sm items-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                                <span className="font-mono font-semibold text-brand-dark dark:text-slate-100">{promo.code}</span>
                                <span className="font-bold text-slate-600 dark:text-slate-300">{t('partnerDashboard.times', { count: promo.usageCount || 0 })}</span>
                                </li>
                            ))}
                            </ul>
                        ) : <p className="text-slate-500 text-sm mt-2">{t('partnerAnalytics.noPromoData')}</p>}
                    </div>
                    <div>
                        <h3 className="font-semibold dark:text-slate-200">{t('partnerAnalytics.topPromosByRevenue')}</h3>
                        {topPromosByRevenue.length > 0 ? (
                            <ul className="space-y-2 mt-2">
                            {topPromosByRevenue.map(item => (
                                <li key={item.promo.id} className="flex justify-between text-sm items-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                                <span className="font-mono font-semibold text-brand-dark dark:text-slate-100">{item.promo.code}</span>
                                <span className="font-bold text-brand-success">{item.revenue.toFixed(2)} $</span>
                                </li>
                            ))}
                            </ul>
                        ) : <p className="text-slate-500 text-sm mt-2">{t('partnerAnalytics.noPromoData')}</p>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                    <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">{t('partnerAnalytics.servicePerformance')}</h2>
                     <div className="space-y-3">
                        <h3 className="font-semibold dark:text-slate-200">{t('partnerAnalytics.mostPopularServices')}</h3>
                        {popularServices.length > 0 ? popularServices.map(([title, count]) => (
                            <div key={title} className="flex justify-between items-center text-sm">
                                <p className="font-medium text-slate-700 dark:text-slate-200 truncate pr-4">{title}</p>
                                <p className="font-bold text-brand-dark dark:text-slate-100">{count} <span className="font-normal text-slate-500 dark:text-slate-400">{t('partnerDashboard.times', { count })}</span></p>
                            </div>
                        )) : <p className="text-slate-500 dark:text-slate-400 text-sm">{t('partnerAnalytics.noServiceData')}</p>}
                    </div>
                </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                    <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">{t('partnerAnalytics.customerInsights')}</h2>
                     <div className="space-y-4">
                        <h3 className="font-semibold dark:text-slate-200">{t('partnerAnalytics.newVsReturning')}</h3>
                        <div className="flex justify-around text-center">
                            <div>
                                <p className="text-4xl font-extrabold text-green-600">{customerData.new}</p>
                                <p className="font-semibold text-slate-600 dark:text-slate-300">{t('partnerAnalytics.new')}</p>
                            </div>
                            <div>
                                <p className="text-4xl font-extrabold text-blue-600">{customerData.returning}</p>
                                <p className="font-semibold text-slate-600 dark:text-slate-300">{t('partnerAnalytics.returning')}</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t dark:border-slate-700">
                            <h3 className="font-semibold dark:text-slate-200">{t('partnerAnalytics.topClients')}</h3>
                            <ul className="space-y-2 mt-2">
                               {topClients.length > 0 ? topClients.map(client => (
                                   <li key={client.name} className="flex justify-between text-sm">
                                       <span className="text-slate-700 dark:text-slate-200">{client.name}</span>
                                       <span className="font-semibold text-slate-800 dark:text-slate-100">{t('partnerAnalytics.ordersCount', { count: client.orders })}</span>
                                   </li>
                               )) : <p className="text-slate-500 dark:text-slate-400 text-sm">{t('partnerAnalytics.noCustomerData')}</p>}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};