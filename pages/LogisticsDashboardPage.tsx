import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { OptimizedRoute } from '../types';
import { StatCard } from '../components/StatCard';
import { BarChart } from '../components/BarChart';
import { LogisticsDriver, LogisticsTask, realApi } from '../services/real-api';

const RouteOptimizationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { user, optimizeRoutes, confirmOptimizedRoutes, addNotification, t } = useAppContext();
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirming, setIsConfirming] = useState(false);
    const [routes, setRoutes] = useState<OptimizedRoute[]>([]);

    useEffect(() => {
        if (isOpen && user?.logisticsPartnerId) {
            setIsLoading(true);
            setRoutes([]);
            optimizeRoutes(user.logisticsPartnerId)
                .then(setRoutes)
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, user, optimizeRoutes]);

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await confirmOptimizedRoutes(routes);
            addNotification(t('logisticsDashboard.optimizeRoutes.assignSuccess'), 'success');
            onClose();
        } catch (error) {
            addNotification(t('logisticsDashboard.optimizeRoutes.assignError'), 'error');
        } finally {
            setIsConfirming(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full relative">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-brand-dark dark:text-slate-100">{t('logisticsDashboard.optimizeRoutes.modalTitle')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('logisticsDashboard.optimizeRoutes.modalDescription')}</p>
                </div>
                <button onClick={onClose} className="p-2 -mt-2 -mr-2 text-slate-400 hover:text-slate-600"><Icon name="xmark" className="w-6 h-6"/></button>
              </div>
  
              <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                {isLoading && (
                    <div className="text-center py-10">
                        <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 dark:text-slate-400">{t('logisticsDashboard.optimizeRoutes.loading')}</p>
                    </div>
                )}
                {!isLoading && routes.length > 0 && routes.map((route, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-700/50 dark:border-slate-700">
                        <h3 className="font-bold text-lg text-brand-dark dark:text-slate-100">{route.driverName}</h3>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-4">
                            <span>{route.missions.length} {t('logisticsDashboard.optimizeRoutes.stops')}</span>
                            <span>{t('logisticsDashboard.optimizeRoutes.estimatedTime')}: {route.estimatedTime}</span>
                        </div>
                        <ol className="mt-2 space-y-2 list-decimal list-inside text-sm">
                           {route.missions.map((mission, mIndex) => (
                               <li key={mIndex} className="p-2 bg-white dark:bg-slate-800 rounded">
                                   <span className={`font-semibold ${mission.type === 'PICKUP' ? 'text-blue-600' : 'text-green-600'}`}>
                                       {mission.type === 'PICKUP' ? t('logisticsDashboard.optimizeRoutes.pickup') : t('logisticsDashboard.optimizeRoutes.delivery')}
                                    </span>: {mission.clientOrPartnerName}
                                   <p className="text-xs text-slate-500 dark:text-slate-400 pl-5">{mission.address}</p>
                               </li>
                           ))}
                        </ol>
                    </div>
                ))}
                {!isLoading && routes.length === 0 && (
                    <div className="text-center py-10">
                        <Icon name="check" className="mx-auto w-10 h-10 text-green-500 mb-2"/>
                        <p className="text-slate-500 dark:text-slate-400">{t('logisticsDashboard.optimizeRoutes.noRoutes')}</p>
                    </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-4 pt-6 mt-4 border-t dark:border-slate-700">
                <button type="button" onClick={onClose} disabled={isConfirming} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-slate-600 dark:text-slate-200">{t('buttons.cancel')}</button>
                <button onClick={handleConfirm} disabled={isLoading || isConfirming || routes.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90 disabled:bg-gray-400">
                  {isConfirming ? t('buttons.saving') : t('logisticsDashboard.optimizeRoutes.confirmButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
    );
};

export const LogisticsDashboardPage: React.FC = () => {
    const { user, logout, addNotification, t, openLogisticsMissionForOrderId, setOpenLogisticsMissionForOrderId } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [liveTasks, setLiveTasks] = useState<LogisticsTask[]>([]);
    const [liveDrivers, setLiveDrivers] = useState<LogisticsDriver[]>([]);
    const missionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (openLogisticsMissionForOrderId) {
            setTimeout(() => {
                missionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            setOpenLogisticsMissionForOrderId(null);
        }
    }, [openLogisticsMissionForOrderId, setOpenLogisticsMissionForOrderId]);

    useEffect(() => {
        let isMounted = true;

        const loadLogisticsData = async () => {
            if (!user || user.role !== 'logistics-manager') {
                if (isMounted) {
                    setLiveTasks([]);
                    setLiveDrivers([]);
                }
                return;
            }

            try {
                const [tasksResponse, driversResponse] = await Promise.all([
                    realApi.getLogisticsTasks({ page: 1, page_size: 100 }),
                    realApi.getLogisticsDrivers({ page: 1, page_size: 100 }),
                ]);

                if (isMounted) {
                    setLiveTasks(tasksResponse.tasks || []);
                    setLiveDrivers(driversResponse.drivers || []);
                }
            } catch {
                if (isMounted) {
                    setLiveTasks([]);
                    setLiveDrivers([]);
                }
            }
        };

        loadLogisticsData();
        return () => {
            isMounted = false;
        };
    }, [user]);

    const { drivers, availableDrivers, stats, chartData, pickupMissions, deliveryMissions } = useMemo(() => {
        if (!user || user.role !== 'logistics-manager') return { drivers: [], availableDrivers: [], stats: {}, chartData: [], pickupMissions: [], deliveryMissions: [] };

        const completedDeliveries = liveTasks.filter(task => task.task_type === 'delivery' && task.status === 'completed');
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dailyDeliveries = completedDeliveries.reduce((acc, task) => {
            const rawDate = task.completed_at || task.updated_at || task.created_at;
            const date = new Date(rawDate).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const chartData = Array.from({ length: 30 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = d.toISOString().split('T')[0];
            return { label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), value: dailyDeliveries[dateKey] || 0 };
        }).reverse();

        return {
            drivers: liveDrivers,
            availableDrivers: liveDrivers.filter(d => d.is_available && d.status === 'active'),
            stats: {
                completedDeliveries: completedDeliveries.length,
                totalEarnings: completedDeliveries.length * 3, // Simulated earnings
                activeMissions: liveTasks.filter(task => ['driver_assigned', 'accepted', 'in_progress'].includes(task.status)).length,
                availableDrivers: liveDrivers.filter(d => d.is_available && d.status === 'active').length,
                totalDrivers: liveDrivers.length
            },
            chartData,
            pickupMissions: liveTasks.filter(task => task.task_type === 'pickup' && task.status === 'pending'),
            deliveryMissions: liveTasks.filter(task => task.task_type === 'delivery' && task.status === 'pending')
        };
    }, [user, liveDrivers, liveTasks]);

    const handleAssignDriver = async (taskId: string, driverId: string, type: 'pickup' | 'delivery') => {
        setIsLoading(true);
        try {
            const updatedTask = await realApi.assignLogisticsTask(taskId, driverId);
            setLiveTasks(tasks => tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
            addNotification(type === 'pickup' ? t('notifications.pickupMissionAssigned') : t('notifications.deliveryMissionAssigned'), 'success');
        } catch (error) {
            addNotification(t('logisticsDashboard.optimizeRoutes.assignError'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (user?.role !== 'logistics-manager') {
        return (
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <h2 className="text-2xl font-bold mb-4 text-red-600">{t('adminPage.accessDenied')}</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">{t('logisticsDashboard.logisticsOnly')}</p>
                <button onClick={() => { logout(); }} className="px-6 py-2 bg-brand-blue text-white font-semibold rounded-lg">
                    {t('adminPage.backToHome')}
                </button>
            </div>
        );
    }
    
    const canOptimize = !!user?.logisticsPartnerId && pickupMissions.length > 0 && availableDrivers.length > 0;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">{t('logisticsDashboard.title')}</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title={t('logisticsDashboard.completedDeliveries')} value={stats.completedDeliveries || 0} iconName="check" />
                <StatCard title={t('logisticsDashboard.totalEarnings')} value={`${(stats.totalEarnings || 0).toFixed(2)} $`} iconName="currencyDollar" />
                <StatCard title={t('logisticsDashboard.activeMissions')} value={stats.activeMissions || 0} iconName="truck" />
                <StatCard title={t('logisticsDashboard.availableDrivers')} value={stats.availableDrivers || 0} iconName="user" />
                <StatCard title={t('logisticsDashboard.totalDrivers')} value={stats.totalDrivers || 0} iconName="users" />
            </div>

            <BarChart data={chartData} title={t('logisticsDashboard.deliveryChartTitle')} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-4">{t('logisticsDashboard.driverListTitle')}</h2>
                        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                            <p>{t('logisticsDashboard.availableDrivers')}: <span className="font-semibold">{stats.availableDrivers || 0}</span></p>
                            <p>{t('logisticsDashboard.activeMissions')}: <span className="font-semibold">{stats.activeMissions || 0}</span></p>
                            <p>{t('logisticsDashboard.pickupMissions')}: <span className="font-semibold">{pickupMissions.length}</span></p>
                            <p>{t('logisticsDashboard.deliveryMissions')}: <span className="font-semibold">{deliveryMissions.length}</span></p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                    <h2 className="text-xl font-bold mb-4">{t('logisticsDashboard.driverListTitle')} ({drivers.length})</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {drivers.length > 0 ? drivers.map(d => (
                            <div key={d.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-700 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-brand-dark dark:text-slate-100">{d.user_name || d.user_email || d.id}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{d.user_email || '-'} / {d.user_phone || '-'}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{d.vehicle_type || d.license_number || '-'}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${d.is_available ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                    {d.is_available ? t('driverDashboard.available') : t('driverDashboard.unavailable')}
                                </span>
                            </div>
                        )) : <p className="text-center text-slate-500">{t('logisticsDashboard.noDrivers')}</p>}
                    </div>
                </div>
            </div>

            <div ref={missionsRef} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{t('logisticsDashboard.availableMissions')}</h2>
                    <button onClick={() => setIsOptimizing(true)} disabled={!canOptimize} title={!canOptimize ? t('logisticsDashboard.optimizeRoutes.disabledTooltip') : ''} className="px-4 py-2 bg-brand-dark text-white font-semibold rounded-lg flex items-center space-x-2 disabled:bg-slate-400">
                        <Icon name="sparkles" className="w-5 h-5"/>
                        <span>{t('logisticsDashboard.optimizeRoutes.button')}</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pickup Missions */}
                    <div>
                        <h3 className="font-semibold mb-2">{t('logisticsDashboard.pickupMissions')} ({pickupMissions.length})</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {pickupMissions.length > 0 ? pickupMissions.map(task => (
                                <form key={task.id} onSubmit={(e) => { e.preventDefault(); handleAssignDriver(task.id, (e.currentTarget.elements.namedItem('driverId') as HTMLSelectElement).value, 'pickup'); }} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-700">
                                    <p className="text-sm font-semibold">{t('logisticsDashboard.collectMissionFor')} {task.order_number || task.id.slice(0, 8)}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{task.customer_name || task.pickup_contact_name || '-'} - {task.pickup_address_line || task.pickup_commune || '-'}</p>
                                    <div className="flex gap-2 mt-2">
                                        <select name="driverId" required className="flex-grow p-1 text-xs border rounded-lg dark:bg-slate-700 dark:border-slate-600">
                                            <option value="">{t('logisticsDashboard.selectCollector')}</option>
                                            {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.user_name || d.user_email || d.id}</option>)}
                                        </select>
                                        <button type="submit" disabled={isLoading} className="px-2 py-1 text-xs bg-brand-success text-white font-semibold rounded-lg disabled:bg-slate-400">{t('logisticsDashboard.confirmAssignment')}</button>
                                    </div>
                                </form>
                            )) : <p className="text-sm text-slate-400">{t('logisticsDashboard.noPickupMissions')}</p>}
                        </div>
                    </div>
                    {/* Delivery Missions */}
                    <div>
                        <h3 className="font-semibold mb-2">{t('logisticsDashboard.deliveryMissions')} ({deliveryMissions.length})</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {deliveryMissions.length > 0 ? deliveryMissions.map(task => (
                                <form key={task.id} onSubmit={(e) => { e.preventDefault(); handleAssignDriver(task.id, (e.currentTarget.elements.namedItem('driverId') as HTMLSelectElement).value, 'delivery'); }} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-700">
                                    <p className="text-sm font-semibold">{t('logisticsDashboard.deliveryMissionFor')} {task.order_number || task.id.slice(0, 8)}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{task.customer_name || task.pickup_contact_name || '-'} - {task.delivery_address_line || task.delivery_commune || '-'}</p>
                                    <div className="flex gap-2 mt-2">
                                        <select name="driverId" required className="flex-grow p-1 text-xs border rounded-lg dark:bg-slate-700 dark:border-slate-600">
                                            <option value="">{t('logisticsDashboard.selectDeliverer')}</option>
                                            {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.user_name || d.user_email || d.id}</option>)}
                                        </select>
                                        <button type="submit" disabled={isLoading} className="px-2 py-1 text-xs bg-brand-success text-white font-semibold rounded-lg disabled:bg-slate-400">{t('logisticsDashboard.confirmAssignment')}</button>
                                    </div>
                                </form>
                            )) : <p className="text-sm text-slate-400">{t('logisticsDashboard.noDeliveryMissions')}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <RouteOptimizationModal isOpen={isOptimizing} onClose={() => setIsOptimizing(false)} />
        </div>
    );
};
