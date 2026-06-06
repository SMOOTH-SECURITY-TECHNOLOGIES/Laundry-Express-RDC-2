
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { User, OrderStatus, Order } from '../types';
import { StatCard } from '../components/StatCard';
import { BarChart } from '../components/BarChart';
import { ChatModal } from '../components/ChatModal';
import { formatAddress } from '../types';
import { LogisticsTask, realApi } from '../services/real-api';

const MissionDetails: React.FC<{ 
    mission: Order; 
    missionDetails: any;
    onChatClick: () => void;
    onActionClick: () => void;
    isLoading: boolean;
    t: (key: string, options?: any) => string;
}> = ({ mission, missionDetails, onChatClick, onActionClick, isLoading, t }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">{t('driverDashboard.currentMission')}</h2>
            <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-700">
                    <p className="font-semibold text-brand-dark dark:text-slate-100">{missionDetails.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{missionDetails.name}</p>
                    {missionDetails.partnerName ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{missionDetails.partnerName}</p>
                    ) : null}
                    {missionDetails.phone ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{missionDetails.phone}</p>
                    ) : null}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{missionDetails.address}</p>
                    {missionDetails.orderNumber ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{missionDetails.orderNumber}</p>
                    ) : null}
                </div>
                <div className="flex space-x-4">
                    <button onClick={onChatClick} className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg flex items-center justify-center space-x-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                        <Icon name="chatBubble" className="w-5 h-5"/>
                        <span>{t('driverDashboard.openChat')}</span>
                    </button>
                    <button onClick={onActionClick} disabled={isLoading} className="flex-1 px-4 py-3 bg-brand-success text-white font-bold rounded-lg flex items-center justify-center space-x-2 hover:bg-opacity-90 disabled:bg-slate-400 transition-all">
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                             <Icon name="check" className="w-5 h-5"/>
                        )}
                        <span>{missionDetails.actionText}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export const DriverDashboardPage: React.FC = () => {
    const { user, getOrdersForDriver, getCompletedOrdersForDriver, updateUser, updateOrderStatus, addNotification, t, openDriverMissionForOrderId, setOpenDriverMissionForOrderId } = useAppContext();
    const [status, setStatus] = useState(user?.driverStatus || 'UNAVAILABLE');
    const [isUpdating, setIsUpdating] = useState(false);
    const [chattingOrder, setChattingOrder] = useState<Order | null>(null);
    const [liveTasks, setLiveTasks] = useState<LogisticsTask[]>([]);
    const missionRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if(openDriverMissionForOrderId) {
            setTimeout(() => {
                missionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            setOpenDriverMissionForOrderId(null);
        }
    }, [openDriverMissionForOrderId, setOpenDriverMissionForOrderId]);

    useEffect(() => {
        let isMounted = true;

        const loadTasks = async () => {
            if (!user || user.role !== 'driver') {
                if (isMounted) {
                    setLiveTasks([]);
                }
                return;
            }

            try {
                const response = await realApi.getLogisticsTasks({ page: 1, page_size: 100 });
                if (isMounted) {
                    setLiveTasks(response.tasks || []);
                }
            } catch {
                if (isMounted) {
                    setLiveTasks([]);
                }
            }
        };

        loadTasks();
        return () => {
            isMounted = false;
        };
    }, [user]);

    const { currentMission, currentTask, stats, missionHistoryChartData } = useMemo(() => {
        if (!user) return { currentMission: null, stats: {}, missionHistoryChartData: [] };

        const completedTasks = liveTasks.filter(task => task.status === 'completed');
        const completed = completedTasks.length > 0 ? completedTasks : getCompletedOrdersForDriver(user.id);
        const dailyMissions = completed.reduce((acc, order) => {
            const rawDate = 'createdAt' in order ? order.createdAt : order.completed_at || order.created_at;
            const date = new Date(rawDate).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const chartData = Array.from({ length: 14 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = d.toISOString().split('T')[0];
            return { 
                label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), 
                value: dailyMissions[dateKey] || 0 
            };
        }).reverse();

        const activeTask = liveTasks.find(task => ['driver_assigned', 'accepted', 'in_progress'].includes(task.status));
        const activeTaskAddress = activeTask?.task_type === 'pickup'
            ? {
                commune: activeTask.pickup_commune || '',
                avenue: activeTask.pickup_address_line || activeTask.pickup_address_label || '',
                numero: '',
            }
            : {
                commune: activeTask?.delivery_commune || '',
                avenue: activeTask?.delivery_address_line || activeTask?.delivery_address_label || '',
                numero: '',
            };
        const activeTaskName =
            activeTask?.customer_name ||
            activeTask?.pickup_contact_name ||
            activeTask?.partner_name ||
            (activeTask ? `Order ${activeTask.order_number || activeTask.order_id.slice(0, 8)}` : '');

        return {
            currentMission: activeTask ? {
                id: activeTask.order_id,
                userId: '',
                partner: null,
                serviceItems: [],
                clientDetails: {
                    name: activeTaskName,
                    phone: activeTask.customer_phone || activeTask.pickup_contact_phone || '',
                    pickupAddress: activeTaskAddress,
                },
                pickupTime: '',
                status: activeTask.task_type === 'pickup' ? OrderStatus.PICKUP : OrderStatus.DELIVERY,
                trackingHistory: [],
                totalPrice: 0,
                createdAt: activeTask.created_at,
            } as Order : getOrdersForDriver(user.id),
            currentTask: activeTask || null,
            stats: {
                completedMissions: completed.length,
                totalEarnings: completed.length * 1.5
            },
            missionHistoryChartData: chartData
        };
    }, [user, getOrdersForDriver, getCompletedOrdersForDriver, liveTasks]);
    
    useEffect(() => {
        if(user?.driverStatus) {
            setStatus(user.driverStatus);
        }
    }, [user?.driverStatus]);

    const handleStatusToggle = async () => {
        if (!user || user.driverStatus === 'ON_MISSION') {
            addNotification(t('driverDashboard.statusLocked'), 'info');
            return;
        }
        const newStatus = status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
        setIsUpdating(true);
        try {
            await updateUser({ ...user, driverStatus: newStatus });
            addNotification(newStatus === 'AVAILABLE' ? t('driverDashboard.statusChangedToAvailable') : t('driverDashboard.statusChangedToUnavailable'), 'success');
        } catch(e) {
            console.error(e);
        } finally {
            setIsUpdating(false);
        }
    };
    
    const missionDetails = useMemo(() => {
        if (!currentMission) return null;
        if (currentTask?.task_type === 'pickup' || currentMission.status === OrderStatus.PICKUP) {
            return {
                title: t('driverDashboard.pickupFrom'),
                name: currentMission.clientDetails?.name,
                partnerName: currentTask?.partner_name || '',
                phone: currentMission.clientDetails?.phone || '',
                address: formatAddress(currentMission.clientDetails?.pickupAddress) || currentTask?.pickup_address_line || currentTask?.order_number || currentTask?.order_id,
                orderNumber: currentTask?.order_number || '',
                actionText:
                    currentTask?.status === 'driver_assigned'
                        ? 'Accept task'
                        : currentTask?.status === 'accepted'
                          ? 'Start pickup'
                          : t('driverDashboard.confirmPickup'),
            };
        }
        if (currentTask?.task_type === 'delivery' || currentMission.status === OrderStatus.DELIVERY) {
            return {
                title: t('driverDashboard.deliverTo'),
                name: currentMission.clientDetails?.name,
                partnerName: currentTask?.partner_name || '',
                phone: currentMission.clientDetails?.phone || '',
                address: formatAddress(currentMission.clientDetails?.pickupAddress) || currentTask?.delivery_address_line || currentTask?.order_number || currentTask?.order_id,
                orderNumber: currentTask?.order_number || '',
                actionText:
                    currentTask?.status === 'driver_assigned'
                        ? 'Accept task'
                        : currentTask?.status === 'accepted'
                          ? 'Start delivery'
                          : t('driverDashboard.confirmDelivery'),
            };
        }
        return null;
    }, [currentMission, currentTask, t]);
    
    const handleActionClick = async () => {
        if (!currentMission) return;
        setIsUpdating(true);
        try {
            if (currentTask) {
                let updatedTask: LogisticsTask;
                if (currentTask.status === 'driver_assigned') {
                    updatedTask = await realApi.acceptLogisticsTask(currentTask.id);
                    addNotification('Task accepted', 'success');
                } else if (currentTask.status === 'accepted') {
                    updatedTask = await realApi.startLogisticsTask(currentTask.id);
                    addNotification('Task started', 'success');
                } else {
                    updatedTask = await realApi.completeLogisticsTask(currentTask.id);
                    addNotification(
                        currentTask.task_type === 'pickup'
                            ? t('driverDashboard.pickupConfirmed')
                            : t('driverDashboard.deliveryConfirmed'),
                        'success'
                    );
                }

                setLiveTasks((tasks) => tasks.map((task) => task.id === updatedTask.id ? updatedTask : task));
                return;
            }

            if (currentMission.status === OrderStatus.PICKUP) {
                await updateOrderStatus(currentMission.id, OrderStatus.PROCESSING);
                addNotification(t('driverDashboard.pickupConfirmed'), 'success');
            } else if (currentMission.status === OrderStatus.DELIVERY) {
                await updateOrderStatus(currentMission.id, OrderStatus.COMPLETED);
                addNotification(t('driverDashboard.deliveryConfirmed'), 'success');
            }
        } catch (error) {
            addNotification(t('driverDashboard.missionUpdateError'), 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    if (!user || user.role !== 'driver') {
        return <div className="text-center p-12 text-slate-500">{t('driverDashboard.driversOnly')}</div>
    }

    return (
        <div className="space-y-8 pb-12">
            <h1 className="text-3xl font-bold dark:text-slate-100">{t('driverDashboard.title')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <StatCard title={t('driverDashboard.missionsCompleted')} value={stats.completedMissions || 0} iconName="check" />
                 <StatCard title={t('driverDashboard.totalEarnings')} value={`${(stats.totalEarnings || 0).toFixed(2)} $`} iconName="currencyDollar" />
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <h2 className="text-xl font-bold mb-4 dark:text-slate-100">{t('driverDashboard.myStatus')}</h2>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border dark:border-slate-700">
                    <div>
                        <p className={`font-bold text-lg ${status === 'AVAILABLE' ? 'text-green-600' : status === 'ON_MISSION' ? 'text-blue-600' : 'text-slate-500'}`}>
                            {t(`driverDashboard.${status.toLowerCase()}`)}
                        </p>
                    </div>
                    <button 
                        onClick={handleStatusToggle}
                        disabled={isUpdating || status === 'ON_MISSION'}
                        className="px-6 py-2 bg-brand-dark text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all"
                    >
                        {status === 'AVAILABLE' ? t('driverDashboard.goUnavailable') : t('driverDashboard.goAvailable')}
                    </button>
                </div>
            </div>

            <div ref={missionRef}>
                {currentMission && missionDetails ? (
                    <MissionDetails 
                        mission={currentMission} 
                        missionDetails={missionDetails}
                        onChatClick={() => setChattingOrder(currentMission)}
                        onActionClick={handleActionClick}
                        isLoading={isUpdating}
                        t={t}
                    />
                ) : (
                    <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:border dark:border-slate-700">
                        <Icon name="truck" className="mx-auto h-16 w-16 text-slate-200 dark:text-slate-700" />
                        <h3 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">{t('driverDashboard.noMissions')}</h3>
                        <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{t('driverDashboard.noMissionsDesc')}</p>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <h2 className="text-xl font-bold mb-6 dark:text-slate-100">{t('driverDashboard.missionHistory')}</h2>
                {missionHistoryChartData.length > 0 ? (
                    <BarChart data={missionHistoryChartData} title={t('driverDashboard.missionChartTitle')} />
                ) : <p className="text-center text-slate-500 py-8">{t('driverDashboard.noMissionHistory')}</p>}
            </div>
            
            <ChatModal
                isOpen={!!chattingOrder}
                onClose={() => setChattingOrder(null)}
                order={chattingOrder}
            />
        </div>
    );
};
