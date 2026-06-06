import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { AdminOverview, Order as ApiOrder, realApi } from '../../services/real-api';
import { BarChart } from '../../components/BarChart';
import { StatCard } from '../../components/StatCard';

type TimeRange = 'week' | 'month' | 'year';

export const Analytics: React.FC = () => {
    const { t, formatPrice } = useAppContext();
    const [timeRange, setTimeRange] = useState<TimeRange>('month');
    const [orders, setOrders] = useState<ApiOrder[]>([]);
    const [overview, setOverview] = useState<AdminOverview | null>(null);

    useEffect(() => {
        let isMounted = true;

        Promise.all([
            realApi.getOrders({ page: 1, page_size: 500 }),
            realApi.getAdminOverview(),
        ])
            .then(([ordersResponse, overviewResponse]) => {
                if (!isMounted) return;
                setOrders(ordersResponse.orders || []);
                setOverview(overviewResponse);
            })
            .catch(() => {
                if (!isMounted) return;
                setOrders([]);
                setOverview(null);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredOrders = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        if (timeRange === 'week') startDate.setDate(now.getDate() - 7);
        if (timeRange === 'month') startDate.setMonth(now.getMonth() - 1);
        if (timeRange === 'year') startDate.setFullYear(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);

        return orders.filter(o => new Date(o.created_at) >= startDate);
    }, [orders, timeRange]);
    
    const completedOrders = useMemo(() => {
        return filteredOrders.filter(o => o.status === 'completed' || o.status === 'delivered');
    }, [filteredOrders]);


    const stats = useMemo(() => {
        const revenue = completedOrders.reduce((sum, order) => sum + Number(order.amount_paid || order.total_amount || 0), 0);
        const ordersCount = filteredOrders.length;
        const avgOrderValue = completedOrders.length > 0 ? revenue / completedOrders.length : 0;
        return {
            revenue,
            ordersCount,
            totalUsersCount: overview?.total_users || 0,
            avgOrderValue,
        };
    }, [completedOrders, filteredOrders, overview]);

    const revenueChartData = useMemo(() => {
        const data = completedOrders.reduce((acc, order) => {
          const date = new Date(order.created_at).toLocaleDateString('fr-CA');
          acc[date] = (acc[date] || 0) + Number(order.amount_paid || order.total_amount || 0);
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
        const grouped = completedOrders.reduce((acc, order) => {
            const partnerName = order.partner_name || order.partner_id || 'Unknown partner';
            if (!acc[partnerName]) {
                acc[partnerName] = { name: partnerName, revenue: 0, orders: 0 };
            }
            acc[partnerName].revenue += Number(order.amount_paid || order.total_amount || 0);
            acc[partnerName].orders += 1;
            return acc;
        }, {} as Record<string, { name: string; revenue: number; orders: number }>);

        const performance = Object.values(grouped)
          .filter(p => p.revenue > 0 || p.orders > 0)
          .sort((a, b) => Number(b.revenue) - Number(a.revenue))
          .slice(0, 10);

        return {
            revenue: performance.map(p => ({ label: p.name, value: p.revenue })),
            orders: performance.map(p => ({ label: p.name, value: p.orders })),
        };
    }, [completedOrders]);
    
    const servicePerformanceData = useMemo(() => {
        const serviceData = completedOrders.reduce((acc: Record<string, number>, order) => {
            (order.items || []).forEach(item => {
                const serviceTitle = item.item_name || t('adminAnalytics.unknownService');
                acc[serviceTitle] = (acc[serviceTitle] || 0) + Number(item.line_total || 0);
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
            const commune = order.pickup_commune || 'Unknown';
            communes[commune] = (communes[commune] || 0) + 1;
        });
        return Object.entries(communes).sort((a, b) => Number(b[1]) - Number(a[1])).map(([label, value]) => ({ label, value }));
    }, [completedOrders]);

    const activityData = useMemo(() => {
        const hours = Array(24).fill(0);
        filteredOrders.forEach(order => {
            const hour = new Date(order.created_at).getHours();
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
                <StatCard title={t('adminDashboard.totalUsers')} value={stats.totalUsersCount} iconName="user" />
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
