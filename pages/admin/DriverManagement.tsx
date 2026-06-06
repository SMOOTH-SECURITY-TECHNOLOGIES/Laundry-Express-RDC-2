import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LogisticsDriver, LogisticsTask, realApi } from '../../services/real-api';

const DriverStatus: React.FC<{ status?: 'AVAILABLE' | 'UNAVAILABLE' | 'ON_MISSION' }> = ({ status }) => {
    const { t } = useAppContext();
    const statusInfo = useMemo(() => {
        switch (status) {
            case 'AVAILABLE': return { text: t('driverDashboard.available'), color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' };
            case 'ON_MISSION': return { text: t('driverDashboard.onMission'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' };
            case 'UNAVAILABLE':
            default: return { text: t('driverDashboard.unavailable'), color: 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200' };
        }
    }, [status, t]);

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
            {statusInfo.text}
        </span>
    );
};

export const DriverManagement: React.FC = () => {
    const { t } = useAppContext();
    const [drivers, setDrivers] = useState<LogisticsDriver[]>([]);
    const [tasks, setTasks] = useState<LogisticsTask[]>([]);

    useEffect(() => {
        let isMounted = true;

        Promise.all([
            realApi.getLogisticsDrivers({ page: 1, page_size: 200 }),
            realApi.getLogisticsTasks({ page: 1, page_size: 200 }),
        ])
            .then(([driversResponse, tasksResponse]) => {
                if (!isMounted) return;
                setDrivers(driversResponse.drivers || []);
                setTasks(tasksResponse.tasks || []);
            })
            .catch(() => {
                if (!isMounted) return;
                setDrivers([]);
                setTasks([]);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const getDriverStatus = (driver: LogisticsDriver): 'AVAILABLE' | 'UNAVAILABLE' | 'ON_MISSION' => {
        const activeTask = tasks.find(task => task.driver_id === driver.id && ['driver_assigned', 'accepted', 'in_progress'].includes(task.status));
        if (activeTask) return 'ON_MISSION';
        return driver.is_available ? 'AVAILABLE' : 'UNAVAILABLE';
    };

    const getCurrentTask = (driverId: string) => {
        return tasks.find(task => task.driver_id === driverId && ['driver_assigned', 'accepted', 'in_progress'].includes(task.status));
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">{t('driverManagement.title')}</h1>
            <div className="bg-white p-6 rounded-2xl shadow-card">
                <h2 className="text-2xl font-bold mb-4">{t('driverManagement.allDrivers', { count: drivers.length })}</h2>
                
                {/* Mobile Card View */}
                <div className="space-y-4 md:hidden">
                    {drivers.map((driver) => {
                        const currentTask = getCurrentTask(driver.id);
                        return (
                            <div key={driver.id} className="p-4 bg-slate-50 border rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-900">{driver.user_name || driver.user_email || driver.id}</p>
                                        <p className="text-xs text-slate-500">{driver.user_email || '-'}</p>
                                    </div>
                                    <DriverStatus status={getDriverStatus(driver)} />
                                </div>
                                <div className="mt-2 pt-2 border-t text-sm space-y-1">
                                    <p><strong>{t('driverManagement.logisticsPartner')}:</strong> {'-'}</p>
                                    <p><strong>{t('driverManagement.vehicle')}:</strong> <span className="font-mono">{driver.vehicle_type || driver.license_number || '-'}</span></p>
                                    <p><strong>{t('driverManagement.currentMission')}:</strong> <span className="font-mono">{currentTask ? (currentTask.order_number || currentTask.id) : t('driverManagement.noMission')}</span></p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('driverManagement.name')}</th>
                                <th scope="col" className="px-6 py-3">{t('driverManagement.logisticsPartner')}</th>
                                <th scope="col" className="px-6 py-3">{t('driverManagement.vehicle')}</th>
                                <th scope="col" className="px-6 py-3">{t('driverManagement.status')}</th>
                                <th scope="col" className="px-6 py-3">{t('driverManagement.currentMission')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.map((driver) => {
                                const currentTask = getCurrentTask(driver.id);
                                
                                return (
                                    <tr key={driver.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <p>{driver.user_name || driver.user_email || driver.id}</p>
                                            <p className="text-xs text-slate-500">{driver.user_email || '-'}</p>
                                            <p className="text-xs text-slate-500">{driver.user_phone || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">-</td>
                                        <td className="px-6 py-4 font-mono text-xs">{driver.vehicle_type || driver.license_number || '-'}</td>
                                        <td className="px-6 py-4">
                                            <DriverStatus status={getDriverStatus(driver)} />
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            {currentTask ? (currentTask.order_number || currentTask.id) : t('driverManagement.noMission')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {drivers.length === 0 && (
                    <p className="text-center text-slate-500 py-8">{t('driverManagement.noDrivers')}</p>
                )}
            </div>
        </div>
    );
};
