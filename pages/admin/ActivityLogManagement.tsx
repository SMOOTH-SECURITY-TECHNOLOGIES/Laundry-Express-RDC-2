import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ActivityLog, ActivityLogAction, User } from '../../types';
import { Icon } from '../../components/Icon';

const ALL_ACTIONS: ActivityLogAction[] = [
  'USER_LOGIN', 'USER_LOGIN_FAILURE', 'USER_2FA_ENABLED', 'USER_2FA_DISABLED',
  'PARTNER_PROFILE_UPDATE', 'PARTNER_SERVICE_ADD', 'PARTNER_SERVICE_UPDATE', 'PARTNER_SERVICE_DELETE',
  'PROMO_CODE_CREATE', 'PROMO_CODE_UPDATE', 'TEAM_MEMBER_INVITE', 'TEAM_MEMBER_ROLE_CHANGE', 'TEAM_MEMBER_REMOVE',
  'ADMIN_SETTINGS_UPDATE', 'COMMISSION_SETTINGS_UPDATE', 'APPLICATION_SETTINGS_UPDATE', 'PARTNER_APPLICATION_APPROVED', 
  'PARTNER_APPLICATION_REJECTED', 'REFUND_REQUEST_APPROVED', 'REFUND_REQUEST_REJECTED', 'ADMIN_LOGIN', 'ADMIN_CREATED', 
  'ADMIN_PERMISSIONS_UPDATED', 'BULK_NOTIFICATION_SENT'
];

const LOGS_PER_PAGE = 20;

export const ActivityLogManagement: React.FC = () => {
    const { fetchAllActivityLogs, getAllUsers, getPartnerById, t } = useAppContext();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ query: '', userId: 'all', action: 'all' });
    const [currentPage, setCurrentPage] = useState(1);

    const users = useMemo(() => getAllUsers(), [getAllUsers]);

    useEffect(() => {
        setIsLoading(true);
        fetchAllActivityLogs()
            .then(data => setLogs(data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())))
            .finally(() => setIsLoading(false));
    }, [fetchAllActivityLogs]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Reset to first page on filter change
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const queryLower = filters.query.toLowerCase();
            const matchesQuery = filters.query === '' || 
                log.userName.toLowerCase().includes(queryLower) ||
                log.details?.toLowerCase().includes(queryLower) ||
                log.id.toLowerCase().includes(queryLower);
            
            const matchesUser = filters.userId === 'all' || log.userId === filters.userId;
            const matchesAction = filters.action === 'all' || log.action === filters.action;

            return matchesQuery && matchesUser && matchesAction;
        });
    }, [logs, filters]);
    
    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
        return filteredLogs.slice(startIndex, startIndex + LOGS_PER_PAGE);
    }, [filteredLogs, currentPage]);

    const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">{t('adminPage.activity', { default: 'Activity Log' })}</h1>
            <div className="bg-white p-6 rounded-2xl shadow-card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-slate-50">
                    <input
                        type="text"
                        name="query"
                        value={filters.query}
                        onChange={handleFilterChange}
                        placeholder={t('activityLog.searchPlaceholder', { default: "Search by user, details, ID..."})}
                        className="w-full p-2 border rounded-lg"
                    />
                     <select name="userId" value={filters.userId} onChange={handleFilterChange} className="w-full p-2 border rounded-lg bg-white">
                        <option value="all">{t('activityLog.allUsers')}</option>
                        {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                    <select name="action" value={filters.action} onChange={handleFilterChange} className="w-full p-2 border rounded-lg bg-white">
                        <option value="all">{t('activityLog.allActions')}</option>
                        {ALL_ACTIONS.map(action => (
                            <option key={action} value={action}>
                                {t(`activityLogActions.${action}`, { default: action })}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-6 py-3">{t('activityLog.date')}</th>
                                <th className="px-6 py-3">{t('activityLog.user')}</th>
                                <th className="px-6 py-3">{t('activityLog.action')}</th>
                                <th className="px-6 py-3">{t('activityLog.partner')}</th>
                                <th className="px-6 py-3">{t('activityLog.details')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-8">{t('buttons.loading')}</td></tr>
                            ) : paginatedLogs.length > 0 ? (
                                paginatedLogs.map(log => {
                                    const partner = log.partnerId ? getPartnerById(log.partnerId) : null;
                                    return (
                                        <tr key={log.id} className="border-b">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                                            <td className="px-6 py-4 font-medium">{log.userName}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium">
                                                    {t(`activityLogActions.${log.action}`, { default: log.action })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{partner?.name || '-'}</td>
                                            <td className="px-6 py-4 text-slate-600 max-w-sm truncate">{log.details || '-'}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={5} className="text-center py-8">{t('activityLog.noLogsFound')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                     <div className="flex justify-center items-center space-x-4 mt-6">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border rounded-lg font-semibold disabled:opacity-50">
                            {t('pressingSelector.previous')}
                        </button>
                        <span className="text-sm font-medium">
                            {t('pressingSelector.pageOf', { current: currentPage, total: totalPages })}
                        </span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border rounded-lg font-semibold disabled:opacity-50">
                             {t('pressingSelector.next')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};