import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { AdminUserSummary, realApi } from '../../services/real-api';
import { Icon } from '../../components/Icon';

export const UserManagement: React.FC = () => {
    const { t } = useAppContext();
    const [users, setUsers] = useState<AdminUserSummary[]>([]);

    useEffect(() => {
        let isMounted = true;

        realApi.getAdminUsers()
            .then((response) => {
                if (isMounted) {
                    setUsers(response || []);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setUsers([]);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">{t('userManagement.title')}</h1>
                <div className="bg-white p-6 rounded-2xl shadow-card">
                    <h2 className="text-2xl font-bold mb-4">{t('userManagement.registeredUsers', { count: users.length })}</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('userManagement.table.name')}</th>
                                    <th scope="col" className="px-6 py-3">{t('userManagement.table.contact')}</th>
                                    <th scope="col" className="px-6 py-3">{t('userManagement.table.loyalty')}</th>
                                    <th scope="col" className="px-6 py-3">{t('userManagement.table.referral')}</th>
                                    <th scope="col" className="px-6 py-3">{t('userManagement.table.joined')}</th>
                                    <th scope="col" className="px-6 py-3">{t('userManagement.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                        <td scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            {user.name}
                                            {(user.role === 'admin' || user.role === 'super_admin') && <span className="ml-2 text-xs font-bold text-red-600">{t('userManagement.adminBadge')}</span>}
                                            {(user.role === 'partner_owner' || user.role === 'partner_staff' || (user.partner_ids || []).length > 0) && <span className="ml-2 text-xs font-bold text-blue-600">{t('userManagement.partnerBadge')}</span>}
                                            {user.role === 'logistics_manager' && <span className="ml-2 text-xs font-bold text-green-600">{t('userManagement.logisticsBadge', { default: 'LOGISTICS' })}</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <span>{user.email}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{user.phone}</p>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-center">-</td>
                                        <td className="px-6 py-4 font-mono text-xs">-</td>
                                        <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                                        <td className="px-6 py-4 text-xs text-gray-400">{t('userManagement.readOnly', { default: 'Read-only' })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {users.length === 0 && (
                        <p className="text-center text-gray-500 py-8">{t('userManagement.noUsers')}</p>
                    )}
                </div>
            </div>
        </>
    );
};
