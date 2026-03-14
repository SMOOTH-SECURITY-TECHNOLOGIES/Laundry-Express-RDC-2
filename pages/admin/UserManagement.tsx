import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User } from '../../types';
import { LinkUserToPartnerModal } from '../../components/LinkUserToPartnerModal';
import { LinkUserToLogisticsPartnerModal } from '../../components/LinkUserToLogisticsPartnerModal';
import { Icon } from '../../components/Icon';

export const UserManagement: React.FC = () => {
    const { getAllUsers, t } = useAppContext();
    const users = getAllUsers();
    const [userToLink, setUserToLink] = useState<User | null>(null);
    const [userToLinkLogistics, setUserToLinkLogistics] = useState<User | null>(null);

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
                                            {(user.role === 'admin' || user.role === 'superadmin') && <span className="ml-2 text-xs font-bold text-red-600">{t('userManagement.adminBadge')}</span>}
                                            {user.partnerId && <span className="ml-2 text-xs font-bold text-blue-600">{t('userManagement.partnerBadge')}</span>}
                                            {user.logisticsPartnerId && <span className="ml-2 text-xs font-bold text-green-600">{t('userManagement.logisticsBadge')}</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <span>{user.email}</span>
                                                {user.isEmailValid === false && (
                                                    <div title={`Raison: ${user.emailInvalidReason || 'Inconnue'}`} className="cursor-help">
                                                        <Icon name="exclamation-circle" className="w-5 h-5 text-red-500"/>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">{user.phone}</p>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-center">{user.loyaltyPoints}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{user.referralCode}</td>
                                        <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                                        <td className="px-6 py-4">
                                            {!(user.role === 'admin' || user.role === 'superadmin') && !user.partnerId && !user.logisticsPartnerId && (
                                                <div className="flex space-x-2">
                                                    <button 
                                                        onClick={() => setUserToLink(user)}
                                                        className="px-3 py-1.5 text-xs font-medium text-brand-blue bg-blue-100 rounded-lg hover:bg-blue-200"
                                                    >
                                                        {t('userManagement.linkToPartner')}
                                                    </button>
                                                    <button 
                                                        onClick={() => setUserToLinkLogistics(user)}
                                                        className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200"
                                                    >
                                                        {t('userManagement.linkToLogisticsPartner')}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
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
            {userToLink && (
                <LinkUserToPartnerModal
                    isOpen={!!userToLink}
                    onClose={() => setUserToLink(null)}
                    user={userToLink}
                />
            )}
            {userToLinkLogistics && (
                <LinkUserToLogisticsPartnerModal
                    isOpen={!!userToLinkLogistics}
                    onClose={() => setUserToLinkLogistics(null)}
                    user={userToLinkLogistics}
                />
            )}
        </>
    );
};