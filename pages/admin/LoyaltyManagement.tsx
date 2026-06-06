
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LoyaltySettings } from '../../types';
import { Icon } from '../../components/Icon';
import { LoyaltyAdminOverview, realApi } from '../../services/real-api';

// Simple toggle switch component
const ToggleSwitch: React.FC<{ isEnabled: boolean; onToggle: () => void; label: string; description: string; }> = ({ isEnabled, onToggle, label, description }) => {
    return (
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
            <div>
                <label htmlFor="loyalty-toggle" className="font-semibold text-slate-800">{label}</label>
                <p className="text-sm text-slate-500">{description}</p>
            </div>
            <label htmlFor="loyalty-toggle" className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isEnabled} onChange={onToggle} id="loyalty-toggle" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
            </label>
        </div>
    );
};


export const LoyaltyManagement: React.FC = () => {
    const { loyaltySettings, updateLoyaltySettings, addNotification, t } = useAppContext();

    const [settings, setSettings] = useState<LoyaltySettings>(loyaltySettings);
    const [isLoading, setIsLoading] = useState(false);
    const [isRunningExpiry, setIsRunningExpiry] = useState(false);
    const [overview, setOverview] = useState<LoyaltyAdminOverview | null>(null);

    const loadOverview = React.useCallback(async () => {
        try {
            const response = await realApi.getLoyaltyAdminOverview();
            setOverview(response);
        } catch {
            setOverview(null);
        }
    }, []);

    useEffect(() => {
        setSettings(loyaltySettings);
    }, [loyaltySettings]);

    useEffect(() => {
        let isMounted = true;

        realApi.getLoyaltyAdminOverview()
            .then((response) => {
                if (isMounted) {
                    setOverview(response);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setOverview(null);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'pointsExpiryDays') {
            const parsed = parseInt(value, 10);
            setSettings(prev => ({ ...prev, pointsExpiryDays: parsed > 0 ? parsed : null }));
            return;
        }
        setSettings(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    };

    const handleToggle = () => {
        setSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateLoyaltySettings(settings);
            await loadOverview();
        } catch (error) {
            addNotification(t('notifications.settingsSaveError'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunExpiry = async () => {
        setIsRunningExpiry(true);
        try {
            const result = await realApi.runLoyaltyExpiration();
            addNotification(
                t('loyaltyManagement.expiryRunSuccess', {
                    default: `${result.expired_points} points expired across ${result.users_processed} users.`,
                }),
                'success'
            );
            await loadOverview();
        } catch {
            addNotification(
                t('loyaltyManagement.expiryRunError', {
                    default: 'Loyalty expiration run failed.',
                }),
                'error'
            );
        } finally {
            setIsRunningExpiry(false);
        }
    };
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">{t('loyaltyManagement.title')}</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                    {t('loyaltyManagement.backendDescription', {
                        default:
                            'Loyalty settings now persist through the backend loyalty settings API and feed the real order and profile surfaces.',
                    })}
                </p>
            </div>

            {overview && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-card">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('loyaltyManagement.report.totalUsersWithPoints', { default: 'Users with points' })}</p>
                        <p className="text-3xl font-bold mt-2 text-slate-900">{overview.total_users_with_points}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-card">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('loyaltyManagement.report.totalPointsBalance', { default: 'Points outstanding' })}</p>
                        <p className="text-3xl font-bold mt-2 text-slate-900">{overview.total_points_balance}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-card">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('loyaltyManagement.report.totalPointsEarned', { default: 'Points earned' })}</p>
                        <p className="text-3xl font-bold mt-2 text-emerald-700">{overview.total_points_earned}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-card">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('loyaltyManagement.report.totalPointsRedeemed', { default: 'Points redeemed' })}</p>
                        <p className="text-3xl font-bold mt-2 text-amber-700">{overview.total_points_redeemed}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-card">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('loyaltyManagement.report.totalPointsExpired', { default: 'Points expired' })}</p>
                        <p className="text-3xl font-bold mt-2 text-rose-700">{overview.total_points_expired}</p>
                    </div>
                </div>
            )}
            {overview && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('loyaltyManagement.report.averageBalance', { default: 'Average balance' })}</p>
                        <p className="text-2xl font-bold mt-2 text-slate-900">{overview.average_points_balance}</p>
                        <p className="text-xs text-slate-500 mt-1">{t('loyaltyManagement.report.averageBalanceDescription', { default: 'Average points held by users who currently have a balance.' })}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('loyaltyManagement.report.pointValue', { default: 'Point value' })}</p>
                        <p className="text-2xl font-bold mt-2 text-emerald-700">{overview.policy_metrics.reward_value_per_point}</p>
                        <p className="text-xs text-slate-500 mt-1">{t('loyaltyManagement.report.pointValueDescription', { default: 'Currency value unlocked by one point according to the current redemption rule.' })}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('loyaltyManagement.report.rewardPer100', { default: 'Reward per 100 spent' })}</p>
                        <p className="text-2xl font-bold mt-2 text-blue-700">{overview.policy_metrics.reward_value_per_100_spent}</p>
                        <p className="text-xs text-slate-500 mt-1">{t('loyaltyManagement.report.rewardPer100Description', { default: 'Approximate currency value earned for every 100 spent under the current policy.' })}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('loyaltyManagement.report.expiryPolicy', { default: 'Expiry policy' })}</p>
                        <p className="text-2xl font-bold mt-2 text-rose-700">
                            {overview.policy_metrics.points_expiry_days ? `${overview.policy_metrics.points_expiry_days}d` : t('loyaltyManagement.report.expiryDisabled', { default: 'Disabled' })}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {t('loyaltyManagement.report.expiryPolicyDescription', {
                                default: `${overview.expiring_points_total} points currently carry expiry timestamps across ${overview.users_with_expiring_points} users.`,
                            })}
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-100 p-4 rounded-2xl max-w-2xl mx-auto">
                <p className="font-semibold">
                    {t('loyaltyManagement.backendTitle', {
                        default: 'Backend-backed loyalty configuration',
                    })}
                </p>
                <p className="text-sm mt-1">
                    {t('loyaltyManagement.backendNotice', {
                        default:
                            'Changes made here now persist through the backend loyalty settings contract used by the real UI. The cards above now reflect the real ledger and active balances.',
                    })}
                </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-card max-w-2xl mx-auto">
                <form onSubmit={handleSave} className="space-y-6">
                    <ToggleSwitch 
                        isEnabled={settings.isEnabled}
                        onToggle={handleToggle}
                        label={t('loyaltyManagement.enableLabel')}
                        description={t('loyaltyManagement.enableDescription')}
                    />

                    <div className={!settings.isEnabled ? 'opacity-50 pointer-events-none' : ''}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="pointsPerDollar" className="block text-sm font-medium text-slate-700">{t('loyaltyManagement.earningRateLabel')}</label>
                                <p className="text-xs text-slate-500 mb-1">{t('loyaltyManagement.earningRateDescription')}</p>
                                <input
                                    type="number"
                                    id="pointsPerDollar"
                                    name="pointsPerDollar"
                                    value={settings.pointsPerDollar}
                                    onChange={handleInputChange}
                                    min="0"
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    disabled={!settings.isEnabled}
                                />
                            </div>
                            <div>
                                <label htmlFor="pointsToDollar" className="block text-sm font-medium text-slate-700">{t('loyaltyManagement.redemptionRateLabel')}</label>
                                <p className="text-xs text-slate-500 mb-1">{t('loyaltyManagement.redemptionRateDescription')}</p>
                                <input
                                    type="number"
                                    id="pointsToDollar"
                                    name="pointsToDollar"
                                    value={settings.pointsToDollar}
                                    onChange={handleInputChange}
                                    min="1"
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    disabled={!settings.isEnabled}
                                />
                            </div>
                            <div>
                                <label htmlFor="pointsExpiryDays" className="block text-sm font-medium text-slate-700">{t('loyaltyManagement.expiryDaysLabel', { default: 'Points expiry (days)' })}</label>
                                <p className="text-xs text-slate-500 mb-1">{t('loyaltyManagement.expiryDaysDescription', { default: 'Use 0 to disable expiration. New positive ledger entries will expire after this many days.' })}</p>
                                <input
                                    type="number"
                                    id="pointsExpiryDays"
                                    name="pointsExpiryDays"
                                    value={settings.pointsExpiryDays ?? 0}
                                    onChange={handleInputChange}
                                    min="0"
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    disabled={!settings.isEnabled}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t">
                        <button
                            type="button"
                            disabled={isRunningExpiry}
                            onClick={handleRunExpiry}
                            className="px-6 py-2 mr-3 border border-rose-300 text-rose-700 font-bold rounded-lg hover:bg-rose-50 disabled:opacity-60"
                        >
                            {isRunningExpiry
                                ? t('loyaltyManagement.runExpiryRunning', { default: 'Running expiry...' })
                                : t('loyaltyManagement.runExpiryButton', { default: 'Run expiration now' })}
                        </button>
                        <button type="submit" disabled={isLoading} className="px-6 py-2 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90 flex items-center space-x-2 disabled:bg-slate-400">
                             {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{t('buttons.saving')}</span>
                                </>
                             ) : (
                                <>
                                    <Icon name="check" className="w-5 h-5" />
                                    <span>{t('loyaltyManagement.saveButton')}</span>
                                </>
                             )}
                        </button>
                    </div>
                </form>
            </div>

            {overview && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-card xl:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold">{t('loyaltyManagement.report.title', { default: 'Recent loyalty activity' })}</h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    {t('loyaltyManagement.report.description', {
                                        default: 'Latest ledger movements across earn, redeem, referral bonus, and admin adjustments.',
                                    })}
                                </p>
                            </div>
                            <div className="text-right text-sm text-slate-500">
                                <div>{t('loyaltyManagement.report.totalEntries', { default: 'Ledger entries' })}: <span className="font-semibold text-slate-800">{overview.ledger_entries_total}</span></div>
                                <div>{t('loyaltyManagement.report.adjustments', { default: 'Net adjustments' })}: <span className="font-semibold text-slate-800">{overview.total_adjustment_points_net}</span></div>
                                <div>{t('loyaltyManagement.report.referralBonus', { default: 'Referral bonus points' })}: <span className="font-semibold text-slate-800">{overview.total_referral_bonus_points}</span></div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="text-xs uppercase bg-slate-100 text-slate-700">
                                    <tr>
                                        <th className="px-4 py-3">{t('loyaltyManagement.report.table.user', { default: 'User' })}</th>
                                        <th className="px-4 py-3">{t('loyaltyManagement.report.table.type', { default: 'Type' })}</th>
                                        <th className="px-4 py-3">{t('loyaltyManagement.report.table.order', { default: 'Order' })}</th>
                                        <th className="px-4 py-3">{t('loyaltyManagement.report.table.delta', { default: 'Delta' })}</th>
                                        <th className="px-4 py-3">{t('loyaltyManagement.report.table.balance', { default: 'Balance' })}</th>
                                        <th className="px-4 py-3">{t('loyaltyManagement.report.table.expires', { default: 'Expires' })}</th>
                                        <th className="px-4 py-3">{t('loyaltyManagement.report.table.when', { default: 'When' })}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {overview.recent_entries.map((entry) => (
                                        <tr key={entry.id} className="border-b last:border-b-0">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900">{entry.user_name || t('loyaltyManagement.report.unknownUser', { default: 'Unknown user' })}</div>
                                                <div className="text-xs text-slate-500">{entry.description}</div>
                                            </td>
                                            <td className="px-4 py-3">{entry.entry_type}</td>
                                            <td className="px-4 py-3">{entry.order_number || '-'}</td>
                                            <td className={`px-4 py-3 font-semibold ${entry.points_delta >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>{entry.points_delta >= 0 ? `+${entry.points_delta}` : entry.points_delta}</td>
                                            <td className="px-4 py-3">{entry.balance_after}</td>
                                            <td className="px-4 py-3">
                                                {entry.expired_at
                                                    ? t('loyaltyManagement.report.expiredTag', { default: 'Expired' })
                                                    : entry.expires_at
                                                        ? new Date(entry.expires_at).toLocaleString()
                                                        : '-'}
                                            </td>
                                            <td className="px-4 py-3">{entry.created_at ? new Date(entry.created_at).toLocaleString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-card">
                            <h2 className="text-2xl font-bold mb-1">{t('loyaltyManagement.report.topUsersTitle', { default: 'Top loyalty users' })}</h2>
                            <p className="text-sm text-slate-500 mb-4">
                                {t('loyaltyManagement.report.topUsersDescription', {
                                    default: 'Highest live point balances in the current environment.',
                                })}
                            </p>
                            <div className="space-y-3">
                                {overview.top_users.map((user, index) => (
                                    <div key={user.user_id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                                        <div>
                                            <div className="font-medium text-slate-900">{index + 1}. {user.user_name}</div>
                                            <div className="text-xs text-slate-500">{user.user_email}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-slate-900">{user.loyalty_points}</div>
                                            <div className="text-xs uppercase tracking-wide text-slate-500">{t('loyaltyManagement.report.points', { default: 'Points' })}</div>
                                        </div>
                                    </div>
                                ))}
                                {overview.top_users.length === 0 && (
                                    <p className="text-sm text-slate-500">{t('loyaltyManagement.report.topUsersEmpty', { default: 'No loyalty balances recorded yet.' })}</p>
                                )}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-card">
                            <h2 className="text-2xl font-bold mb-1">{t('loyaltyManagement.report.topRedeemersTitle', { default: 'Top redeemers' })}</h2>
                            <p className="text-sm text-slate-500 mb-4">
                                {t('loyaltyManagement.report.topRedeemersDescription', {
                                    default: 'Users who have consumed the most loyalty points so far.',
                                })}
                            </p>
                            <div className="space-y-3">
                                {overview.top_redeemers.map((user, index) => (
                                    <div key={user.user_id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                                        <div>
                                            <div className="font-medium text-slate-900">{index + 1}. {user.user_name}</div>
                                            <div className="text-xs text-slate-500">{user.user_email}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-amber-700">{user.total_points_redeemed}</div>
                                            <div className="text-xs uppercase tracking-wide text-slate-500">{t('loyaltyManagement.report.redeemedPoints', { default: 'Redeemed' })}</div>
                                        </div>
                                    </div>
                                ))}
                                {overview.top_redeemers.length === 0 && (
                                    <p className="text-sm text-slate-500">{t('loyaltyManagement.report.topRedeemersEmpty', { default: 'No loyalty redemptions recorded yet.' })}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
