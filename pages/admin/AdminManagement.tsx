import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { AdminUserSummary, realApi } from '../../services/real-api';

export const AdminManagement: React.FC = () => {
    const { user, t, addNotification } = useAppContext();
    const [admins, setAdmins] = useState<AdminUserSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        realApi.getAdminUsers(300)
            .then((users) => {
                if (!isMounted) {
                    return;
                }

                const adminUsers = (users || []).filter(
                    (candidate) =>
                        (candidate.role === 'admin' || candidate.role === 'super_admin') &&
                        candidate.id !== user?.id
                );
                setAdmins(adminUsers);
            })
            .catch(() => {
                if (isMounted) {
                    setAdmins([]);
                    addNotification(
                        t('adminAdminManagement.loadError', {
                            default: 'Failed to load admin users.',
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
    }, [addNotification, t, user?.id]);

    const stats = useMemo(() => {
        return {
            total: admins.length,
            superAdmins: admins.filter((admin) => admin.role === 'super_admin').length,
            admins: admins.filter((admin) => admin.role === 'admin').length,
        };
    }, [admins]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">{t('adminAdminManagement.title')}</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                    {t('adminAdminManagement.readOnlyDescription', {
                        default:
                            'This screen now reads real admin users from the backend. Admin creation and fine-grained permission editing remain disabled here until a proven backend admin-management contract exists.',
                    })}
                </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-100 p-4 rounded-2xl">
                <p className="font-semibold">
                    {t('adminAdminManagement.readOnlyTitle', {
                        default: 'Read-only admin management',
                    })}
                </p>
                <p className="text-sm mt-1">
                    {t('adminAdminManagement.readOnlyNotice', {
                        default:
                            'Admin listing is backed by the real backend user route. Creating admins and editing granular permissions are not yet exposed through a proven backend control plane here.',
                    })}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('adminAdminManagement.totalAdmins', { default: 'Total admins' })}
                    </p>
                    <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('adminAdminManagement.superAdmins', { default: 'Super admins' })}
                    </p>
                    <p className="text-3xl font-bold mt-2">{stats.superAdmins}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('adminAdminManagement.standardAdmins', { default: 'Platform admins' })}
                    </p>
                    <p className="text-3xl font-bold mt-2">{stats.admins}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{t('adminAdminManagement.existingAdmins')}</h2>
                    <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-full">
                        {t('adminAdminManagement.readOnlyBadge', { default: 'Read-only' })}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th className="px-6 py-3">{t('adminAdminManagement.adminName')}</th>
                                <th className="px-6 py-3">{t('loginPage.email')}</th>
                                <th className="px-6 py-3">{t('registerPage.phone')}</th>
                                <th className="px-6 py-3">{t('adminAdminManagement.role')}</th>
                                <th className="px-6 py-3">{t('activityLog.date')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        {t('buttons.loading')}
                                    </td>
                                </tr>
                            ) : admins.length > 0 ? (
                                admins.map((admin) => (
                                    <tr key={admin.id} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{admin.name}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{admin.email}</td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{admin.phone}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'}`}>
                                                {admin.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            {admin.created_at ? new Date(admin.created_at).toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        {t('adminAdminManagement.noAdmins')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
