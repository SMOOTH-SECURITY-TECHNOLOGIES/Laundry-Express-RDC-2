import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ActivityLog, User } from '../../types';
import { Icon } from '../../components/Icon';

const TwoFactorAuthCard: React.FC = () => {
    const { user, updateUser, enable2FA, disable2FA, t } = useAppContext();
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEnable = () => {
        setIsSettingUp(true);
        setError('');
        setCode('');
    };
    
    const handleVerify = async () => {
        if (!user || code.length !== 6) {
            setError(t('security.twoFactorAuth.setup.invalidCode'));
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const { success, user: updatedUser } = await enable2FA(user.id, code);
            if (success && updatedUser) {
                updateUser(updatedUser);
                setIsSettingUp(false);
            } else {
                setError(t('security.twoFactorAuth.setup.invalidCode'));
            }
        } catch (e) {
            setError(t('security.twoFactorAuth.setup.invalidCode'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDisable = async () => {
        if (user && window.confirm(t('security.twoFactorAuth.confirmDisable'))) {
            setIsLoading(true);
            try {
                const updatedUser = await disable2FA(user.id);
                updateUser(updatedUser);
            } catch (e) {
                // handle error
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <h2 className="text-2xl font-bold dark:text-slate-100">{t('security.twoFactorAuth.title')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-4">{t('security.twoFactorAuth.description')}</p>
            
            {isSettingUp ? (
                <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-700/50 space-y-4 animate-fade-in">
                    <h3 className="font-bold text-lg dark:text-slate-100">{t('security.twoFactorAuth.setup.title')}</h3>
                    <div className="md:flex items-center gap-6">
                        <div className="text-center md:text-left">
                            <p className="text-sm dark:text-slate-300 mb-2">{t('security.twoFactorAuth.setup.step1')}</p>
                            <div className="bg-white p-2 inline-block rounded-lg">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/LaundryExpress:${user?.email}?secret=JBSWY3DPEHPK3PXP&issuer=LaundryExpress`} alt={t('security.twoFactorAuth.setup.qrAlt')} width="150" height="150" />
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0 flex-grow">
                             <p className="text-sm dark:text-slate-300 mb-2">{t('security.twoFactorAuth.setup.step2')}</p>
                             <label htmlFor="2fa-code" className="sr-only">{t('security.twoFactorAuth.setup.verificationCode')}</label>
                             <input
                                id="2fa-code"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                maxLength={6}
                                placeholder="123456"
                                className="w-full p-3 text-2xl tracking-[1em] text-center font-mono border rounded-lg dark:bg-slate-800 dark:border-slate-600"
                            />
                            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                        </div>
                    </div>
                     <div className="flex justify-end space-x-2 pt-4">
                        <button onClick={() => setIsSettingUp(false)} className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-600 rounded-lg">{t('buttons.cancel')}</button>
                        <button onClick={handleVerify} disabled={isLoading} className="px-4 py-2 text-sm bg-brand-success text-white rounded-lg disabled:bg-slate-400">{isLoading ? t('buttons.loading') : t('security.twoFactorAuth.setup.verifyAndEnable')}</button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">{t('security.twoFactorAuth.status')}</p>
                        <p className={`font-bold text-lg ${user?.is2FAEnabled ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {user?.is2FAEnabled ? t('security.twoFactorAuth.enabled') : t('security.twoFactorAuth.disabled')}
                        </p>
                    </div>
                    {user?.is2FAEnabled ? (
                        <button onClick={handleDisable} disabled={isLoading} className="px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 font-semibold rounded-lg disabled:opacity-50">{t('security.twoFactorAuth.disableButton')}</button>
                    ) : (
                        <button onClick={handleEnable} disabled={isLoading} className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg disabled:opacity-50">{t('security.twoFactorAuth.enableButton')}</button>
                    )}
                </div>
            )}
        </div>
    );
}

const ActivityLogCard: React.FC = () => {
    const { user, fetchActivityLogs, getAllUsers, t } = useAppContext();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState('all');

    const teamMembers = useMemo(() => {
        if (!user?.partnerId) return [];
        return getAllUsers().filter(u => u.partnerId === user.partnerId);
    }, [getAllUsers, user]);

    useEffect(() => {
        if (user?.partnerId) {
            setIsLoading(true);
            fetchActivityLogs(user.partnerId)
                .then(setLogs)
                .finally(() => setIsLoading(false));
        }
    }, [user, fetchActivityLogs]);
    
    const filteredLogs = useMemo(() => {
        if (selectedUserId === 'all') return logs;
        return logs.filter(log => log.userId === selectedUserId);
    }, [logs, selectedUserId]);

    return (
         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <div className="md:flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold dark:text-slate-100">{t('security.activityLog.title')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('security.activityLog.description')}</p>
                </div>
                <div className="mt-4 md:mt-0">
                    <label htmlFor="user-filter" className="sr-only">{t('security.activityLog.filterByUser')}</label>
                    <select id="user-filter" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="p-2 border rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600">
                        <option value="all">{t('security.activityLog.allUsers')}</option>
                        {teamMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {isLoading ? <p>{t('buttons.loading')}</p> :
                 filteredLogs.length > 0 ? filteredLogs.map(log => (
                    <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-l-4 dark:border-slate-600">
                        <div className="flex justify-between items-start text-sm">
                            <div>
                                <p><span className="font-semibold dark:text-slate-100">{log.userName}</span> {t(`security.activityLog.actions.${log.action}`)}</p>
                                {log.details && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{log.details}</p>}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                 )) : <p className="text-center text-slate-500 py-8">{t('security.activityLog.noLogs')}</p>
                }
            </div>
        </div>
    );
};

export const SecurityPage: React.FC = () => {
    const { t } = useAppContext();
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold dark:text-slate-100">{t('security.title')}</h1>
            <TwoFactorAuthCard />
            <ActivityLogCard />
        </div>
    );
};