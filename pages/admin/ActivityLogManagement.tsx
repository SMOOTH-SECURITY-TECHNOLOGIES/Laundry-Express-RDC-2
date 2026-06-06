import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { AdminActivityLog, AdminUserSummary, realApi } from '../../services/real-api';

const LOGS_PER_PAGE = 20;

export const ActivityLogManagement: React.FC = () => {
    const { t, addNotification } = useAppContext();
    const [logs, setLogs] = useState<AdminActivityLog[]>([]);
    const [users, setUsers] = useState<AdminUserSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ query: '', userId: 'all', action: 'all' });
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        let isMounted = true;

        Promise.all([
            realApi.getAdminActivityLogs(300),
            realApi.getAdminUsers(300),
        ])
            .then(([activityResponse, userResponse]) => {
                if (!isMounted) {
                    return;
                }

                const activityLogs = activityResponse.logs || [];
                setLogs(
                    [...activityLogs].sort(
                        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                );
                setUsers(userResponse || []);
            })
            .catch(() => {
                if (isMounted) {
                    setLogs([]);
                    setUsers([]);
                    addNotification(
                        t('activityLog.loadError', {
                            default: 'Failed to load backend activity logs.',
                        }),
                        'error'
                    );
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [addNotification, t]);

    const availableActions = useMemo(() => {
        return Array.from(new Set(logs.map((log) => log.action))).sort();
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const queryLower = filters.query.toLowerCase();
            const matchesQuery =
                filters.query === '' ||
                log.user_name.toLowerCase().includes(queryLower) ||
                (log.details || '').toLowerCase().includes(queryLower) ||
                log.id.toLowerCase().includes(queryLower) ||
                log.resource_type.toLowerCase().includes(queryLower);

            const matchesUser = filters.userId === 'all' || log.user_id === filters.userId;
            const matchesAction = filters.action === 'all' || log.action === filters.action;

            return matchesQuery && matchesUser && matchesAction;
        });
    }, [logs, filters]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
        return filteredLogs.slice(startIndex, startIndex + LOGS_PER_PAGE);
    }, [filteredLogs, currentPage]);

    const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">{t('adminPage.activity', { default: 'Activity Log' })}</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                    {t('activityLog.backendDescription', {
                        default:
                            'This screen now reads the real backend audit log table. Coverage still depends on which server-side actions actually write audit entries.',
                    })}
                </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-100 p-4 rounded-2xl">
                <p className="font-semibold">
                    {t('activityLog.backendBackedTitle', {
                        default: 'Backend-backed activity listing',
                    })}
                </p>
                <p className="text-sm mt-1">
                    {t('activityLog.backendBackedNotice', {
                        default:
                            'The listing is now sourced from `/admin/activity-logs`. If the table is sparse, that means audit producers are still incomplete, not that the page is using a frontend mock.',
                    })}
                </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-slate-50 dark:bg-slate-700/40 dark:border-slate-600">
                    <input
                        type="text"
                        name="query"
                        value={filters.query}
                        onChange={handleFilterChange}
                        placeholder={t('activityLog.searchPlaceholder', { default: 'Search by user, details, resource, ID...' })}
                        className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600"
                    />
                    <select
                        name="userId"
                        value={filters.userId}
                        onChange={handleFilterChange}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600"
                    >
                        <option value="all">{t('activityLog.allUsers')}</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name}
                            </option>
                        ))}
                    </select>
                    <select
                        name="action"
                        value={filters.action}
                        onChange={handleFilterChange}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600"
                    >
                        <option value="all">{t('activityLog.allActions')}</option>
                        {availableActions.map((action) => (
                            <option key={action} value={action}>
                                {action}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th className="px-6 py-3">{t('activityLog.date')}</th>
                                <th className="px-6 py-3">{t('activityLog.user')}</th>
                                <th className="px-6 py-3">{t('activityLog.action')}</th>
                                <th className="px-6 py-3">{t('activityLog.partner', { default: 'Resource' })}</th>
                                <th className="px-6 py-3">{t('activityLog.details')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8">
                                        {t('buttons.loading')}
                                    </td>
                                </tr>
                            ) : paginatedLogs.length > 0 ? (
                                paginatedLogs.map((log) => (
                                    <tr key={log.id} className="border-b dark:border-slate-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                                            {log.user_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded text-xs font-medium">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {log.resource_type}
                                            {log.resource_id ? ` (${log.resource_id})` : ''}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-sm truncate">
                                            {log.details || '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-400">
                                        {t('activityLog.noLogsFound')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 ? (
                    <div className="flex justify-center items-center space-x-4 mt-6">
                        <button
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border rounded-lg font-semibold disabled:opacity-50"
                        >
                            {t('pressingSelector.previous')}
                        </button>
                        <span className="text-sm font-medium">
                            {t('pressingSelector.pageOf', { current: currentPage, total: totalPages })}
                        </span>
                        <button
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border rounded-lg font-semibold disabled:opacity-50"
                        >
                            {t('pressingSelector.next')}
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
