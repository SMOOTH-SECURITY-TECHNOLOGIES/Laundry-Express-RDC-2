import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order, OrderStatus, Partner, User } from '../../types';
import { BarChart } from '../../components/BarChart';
import { StatCard } from '../../components/StatCard';

type TimeRange = 'week' | 'month' | 'year';

export const Analytics: React.FC = () => {
    const { partners, getAllOrders, getAllUsers, t, formatPrice } = useAppContext();
    const [timeRange, setTimeRange] = useState<TimeRange>('month');

    const { filteredOrders, filteredNewUsers } = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        if (timeRange === 'week') startDate.setDate(now.getDate() - 7);
        if (timeRange === 'month') startDate.setMonth(now.getMonth() - 1);
        if (timeRange === 'year') startDate.setFullYear(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);

        const orders = getAllOrders().filter(o => new Date(o.createdAt) >= startDate);
        const users = getAllUsers().filter(u => new Date(u.createdAt) >= startDate);

        return { filteredOrders: orders, filteredNewUsers: users };
    }, [getAllOrders, getAllUsers, timeRange]);
    
    const completedOrders = useMemo(() => {
        return filteredOrders.filter(o => o.status === OrderStatus.COMPLETED);
    }, [filteredOrders]);


    const stats = useMemo(() => {
        const revenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        const ordersCount = filteredOrders.length;
        const avgOrderValue = completedOrders.length > 0 ? revenue / completedOrders.length : 0;
        return {
            revenue,
            ordersCount,
            newUsersCount: filteredNewUsers.length,
            avgOrderValue,
        };
    }, [completedOrders, filteredOrders, filteredNewUsers]);

    const revenueChartData = useMemo(() => {
        const data = completedOrders.reduce((acc, order) => {
          const date = new Date(order.createdAt).toLocaleDateString('fr-CA'); // YYYY-MM-DD format for easy sorting
          acc[date] = (acc[date] || 0) + order.totalPrice;
          return acc;
        }, {} as { [key: string]: number });

        return Object.entries(data)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([date, value]) => ({
                label: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
                value,
            }));
    }, [completedOrders]);
    
    const partnerPerformanceData = useMemo(() => {
        const performance = partners.map(partner => {
            const partnerOrders = completedOrders.filter(o => o.partner?.id === partner.id);
            const revenue = partnerOrders.reduce((sum: number, order: Order) => sum + order.totalPrice, 0);
            return { name: partner.name, revenue, orders: partnerOrders.length };
        }).filter(p => p.revenue > 0 || p.orders > 0)
          .sort((a, b) => Number(b.revenue) - Number(a.revenue))
          .slice(0, 10);

        return {
            revenue: performance.map(p => ({ label: p.name, value: p.revenue })),
            orders: performance.map(p => ({ label: p.name, value: p.orders })),
        };
    }, [partners, completedOrders]);
    
    const servicePerformanceData = useMemo(() => {
        const serviceData = completedOrders.reduce((acc: Record<string, number>, order) => {
            order.serviceItems.forEach(si => {
                const serviceTitle = si.service?.title || t('adminAnalytics.unknownService');
                acc[serviceTitle] = (acc[serviceTitle] || 0) + order.totalPrice / order.serviceItems.length; // Approximate revenue per service
            });
            return acc;
        }, {} as Record<string, number>);
    
        return Object.entries(serviceData)
            .sort((a,b) => Number(b[1]) - Number(a[1]))
            .slice(0,10)
            .map(([label, value]) => ({ label, value }));
    }, [completedOrders, t]);


    const geoData = useMemo(() => {
        const communes: { [key: string]: number } = {};
        completedOrders.forEach(order => {
            if (order.clientDetails?.pickupAddress && typeof order.clientDetails.pickupAddress === 'object' && 'commune' in order.clientDetails.pickupAddress) {
                const commune = order.clientDetails.pickupAddress.commune || 'Inconnue';
                communes[commune] = (communes[commune] || 0) + 1;
            }
        });
        return Object.entries(communes).sort((a, b) => Number(b[1]) - Number(a[1])).map(([label, value]) => ({ label, value }));
    }, [completedOrders]);

    const activityData = useMemo(() => {
        const hours = Array(24).fill(0);
        filteredOrders.forEach(order => {
            const hour = new Date(order.createdAt).getHours();
            hours[hour]++;
        });
        return hours.map((value, index) => ({ label: `${index}h`, value })).filter(d => d.value > 0);
    }, [filteredOrders]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold">{t('adminAnalytics.title')}</h1>
                <div className="flex p-1 rounded-full bg-slate-100">
                    {(['week', 'month', 'year'] as TimeRange[]).map(range => (
                        <button 
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-sm font-semibold rounded-full ${timeRange === range ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-600'}`}
                        >
                            {t(`adminAnalytics.timeRange.${range}`)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('adminAnalytics.revenueOverPeriod')} value={formatPrice(stats.revenue)} iconName="currencyDollar" />
                <StatCard title={t('adminAnalytics.ordersOverPeriod')} value={stats.ordersCount} iconName="shirt" />
                <StatCard title={t('adminAnalytics.newUsers')} value={stats.newUsersCount} iconName="user" />
                <StatCard title={t('adminAnalytics.avgOrderValue')} value={formatPrice(stats.avgOrderValue)} iconName="sparkles" />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-card">
                <BarChart data={revenueChartData} title={`${t('adminAnalytics.revenue')} (${t(`adminAnalytics.timeRange.${timeRange}`)})`} valueFormatter={formatPrice} />
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-card">
                <h2 className="text-2xl font-bold mb-4">{t('adminAnalytics.partnerPerformance')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <BarChart data={partnerPerformanceData.revenue} title={t('adminAnalytics.revenue')} valueFormatter={formatPrice} />
                    <BarChart data={partnerPerformanceData.orders} title={t('adminAnalytics.orders')} barColor="bg-brand-cyan" />
                </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-card">
                     <h2 className="text-2xl font-bold mb-4">{t('adminAnalytics.servicePerformance')}</h2>
                     <BarChart data={servicePerformanceData} title={t('adminAnalytics.revenueByService')} barColor="bg-brand-dark" valueFormatter={formatPrice} />
                </div>
                 <div className="bg-white p-6 rounded-2xl shadow-card">
                     <h2 className="text-2xl font-bold mb-4">{t('adminAnalytics.geographicalAnalysis')}</h2>
                     {geoData.length > 0 ? <BarChart data={geoData} barColor="bg-brand-success" title="" /> : <p className="text-center text-slate-500 py-12">{t('adminAnalytics.noGeoData')}</p>}
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-card">
                 <h2 className="text-2xl font-bold mb-4">{t('adminAnalytics.activityAnalysis')}</h2>
                 {activityData.length > 0 ? <BarChart data={activityData} title={t('adminAnalytics.peakHours')} barColor="bg-yellow-500" /> : <p className="text-center text-slate-500 py-12">{t('adminAnalytics.noActivityData')}</p>}
            </div>
        </div>
    );
};