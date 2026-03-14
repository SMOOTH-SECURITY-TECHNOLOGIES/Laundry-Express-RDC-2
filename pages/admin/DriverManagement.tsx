import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';

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
    const { getAllUsers, getLogisticsPartnerById, getAllOrders, t } = useAppContext();

    const allDrivers = useMemo(() => {
        return getAllUsers().filter(user => user.role === 'driver');
    }, [getAllUsers]);
    
    const allOrders = getAllOrders();

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">{t('driverManagement.title')}</h1>
            <div className="bg-white p-6 rounded-2xl shadow-card">
                <h2 className="text-2xl font-bold mb-4">{t('driverManagement.allDrivers', { count: allDrivers.length })}</h2>
                
                {/* Mobile Card View */}
                <div className="space-y-4 md:hidden">
                    {allDrivers.map((driver) => {
                        const partner = driver.logisticsPartnerId ? getLogisticsPartnerById(driver.logisticsPartnerId) : null;
                        const currentOrder = allOrders.find(o => o.driverId === driver.id && o.status !== 'COMPLETED' && o.status !== 'REJECTED');
                        return (
                            <div key={driver.id} className="p-4 bg-slate-50 border rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-900">{driver.name}</p>
                                        <p className="text-xs text-slate-500">{driver.email}</p>
                                    </div>
                                    <DriverStatus status={driver.driverStatus} />
                                </div>
                                <div className="mt-2 pt-2 border-t text-sm space-y-1">
                                    <p><strong>{t('driverManagement.logisticsPartner')}:</strong> {partner?.name || 'N/A'}</p>
                                    <p><strong>{t('driverManagement.vehicle')}:</strong> <span className="font-mono">{driver.vehicleInfo}</span></p>
                                    <p><strong>{t('driverManagement.currentMission')}:</strong> <span className="font-mono">{currentOrder ? currentOrder.id : t('driverManagement.noMission')}</span></p>
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
                            {allDrivers.map((driver) => {
                                const partner = driver.logisticsPartnerId ? getLogisticsPartnerById(driver.logisticsPartnerId) : null;
                                const currentOrder = allOrders.find(o => o.driverId === driver.id && o.status !== 'COMPLETED' && o.status !== 'REJECTED');
                                
                                return (
                                    <tr key={driver.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <p>{driver.name}</p>
                                            <p className="text-xs text-slate-500">{driver.email}</p>
                                            <p className="text-xs text-slate-500">{driver.phone}</p>
                                        </td>
                                        <td className="px-6 py-4">{partner?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{driver.vehicleInfo}</td>
                                        <td className="px-6 py-4">
                                            <DriverStatus status={driver.driverStatus} />
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            {currentOrder ? currentOrder.id : t('driverManagement.noMission')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {allDrivers.length === 0 && (
                    <p className="text-center text-slate-500 py-8">{t('driverManagement.noDrivers')}</p>
                )}
            </div>
        </div>
    );
};