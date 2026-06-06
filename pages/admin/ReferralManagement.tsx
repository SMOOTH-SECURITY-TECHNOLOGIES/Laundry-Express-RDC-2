import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ReferralSettings } from '../../types';
import { Icon } from '../../components/Icon';
import { ReferralAdminOverview, realApi } from '../../services/real-api';

const ToggleSwitch: React.FC<{ isEnabled: boolean; onToggle: () => void; label: string; description: string; }> = ({ isEnabled, onToggle, label, description }) => (
    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
        <div>
            <label htmlFor="referral-toggle" className="font-semibold text-slate-800">{label}</label>
            <p className="text-sm text-slate-500">{description}</p>
        </div>
        <label htmlFor="referral-toggle" className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={isEnabled} onChange={onToggle} id="referral-toggle" className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
        </label>
    </div>
);

export const ReferralManagement: React.FC = () => {
    const { referralSettings, updateReferralSettings, addNotification, t } = useAppContext();

    const [settings, setSettings] = useState<ReferralSettings>(referralSettings);
    const [isLoading, setIsLoading] = useState(false);
    const [overview, setOverview] = useState<ReferralAdminOverview | null>(null);
    const [reviewLoadingId, setReviewLoadingId] = useState<string | null>(null);

    const isHighRisk = (reviewStatus?: string | null) => (reviewStatus || '').toLowerCase() === 'reviewed_high_risk';

    const loadOverview = () => {
        realApi.getReferralAdminOverview()
            .then((response) => {
                setOverview(response);
            })
            .catch(() => {
                setOverview(null);
            });
    };

    useEffect(() => {
        setSettings(referralSettings);
    }, [referralSettings]);

    useEffect(() => {
        let isMounted = true;

        realApi.getReferralAdminOverview()
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

    const handleReviewStatus = async (referrerUserId: string, reviewStatus: string) => {
        setReviewLoadingId(referrerUserId);
        try {
            await realApi.updateReferralReviewStatus(referrerUserId, {
                review_status: reviewStatus,
                review_note: `Updated from referral watchlist: ${reviewStatus}`,
            });
            loadOverview();
        } catch (error) {
            addNotification(t('notifications.settingsSaveError'), 'error');
        } finally {
            setReviewLoadingId(null);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleToggle = () => {
        setSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateReferralSettings(settings);
        } catch (error) {
            addNotification(t('notifications.settingsSaveError'), 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">{t('referralManagement.title')}</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                    {t('referralManagement.backendDescription', {
                        default:
                            'Referral settings now persist through the backend referral settings API and feed the real profile and order surfaces.',
                    })}
                </p>
            </div>
            {overview && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-card">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('referralManagement.report.totalCodes', { default: 'Users with referral codes' })}</p>
                        <p className="text-3xl font-bold mt-2 text-slate-900">{overview.total_users_with_referral_codes}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-card">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('referralManagement.report.totalReferredUsers', { default: 'Referred users' })}</p>
                        <p className="text-3xl font-bold mt-2 text-slate-900">{overview.total_referred_users}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-card">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('referralManagement.report.discountsUsed', { default: 'Referral discounts used' })}</p>
                        <p className="text-3xl font-bold mt-2 text-emerald-700">{overview.total_referral_discounts_used}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-card">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('referralManagement.report.bonusPoints', { default: 'Bonus points awarded' })}</p>
                        <p className="text-3xl font-bold mt-2 text-blue-700">{overview.total_referrer_bonus_points_awarded}</p>
                    </div>
                </div>
            )}
            {overview && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('referralManagement.report.signedUpOnly', { default: 'Signed up only' })}</p>
                        <p className="text-2xl font-bold mt-2 text-slate-900">{overview.total_referred_signed_up_only}</p>
                        <p className="text-xs text-slate-500 mt-1">{t('referralManagement.report.signedUpOnlyDescription', { default: 'Referred users who registered but have not yet used their referral discount.' })}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('referralManagement.report.pendingBonus', { default: 'Pending bonus' })}</p>
                        <p className="text-2xl font-bold mt-2 text-amber-700">{overview.total_referred_pending_bonus}</p>
                        <p className="text-xs text-slate-500 mt-1">{t('referralManagement.report.pendingBonusDescription', { default: 'Referred users who consumed the discount but have not yet triggered the referrer bonus.' })}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{t('referralManagement.report.completedConversions', { default: 'Completed conversions' })}</p>
                        <p className="text-2xl font-bold mt-2 text-emerald-700">{overview.total_completed_referral_conversions}</p>
                        <p className="text-xs text-slate-500 mt-1">{t('referralManagement.report.completedConversionsDescription', { default: 'Referred users whose first paid order already triggered the referrer reward.' })}</p>
                    </div>
                </div>
            )}
            <div className="bg-blue-50 border border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-100 p-4 rounded-2xl max-w-2xl mx-auto">
                <p className="font-semibold">
                    {t('referralManagement.backendTitle', {
                        default: 'Backend-backed referral configuration',
                    })}
                </p>
                <p className="text-sm mt-1">
                    {t('referralManagement.backendNotice', {
                        default:
                            'Changes made here now persist through the backend referral settings contract used by the real UI. The cards above now reflect actual referred users, consumed discounts, and awarded bonuses.',
                    })}
                </p>
            </div>
            {overview && overview.watchlist.some((entry) => isHighRisk(entry.review_status)) && (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-2xl max-w-3xl mx-auto">
                    <p className="font-semibold">
                        {t('referralManagement.report.enforcementTitle', {
                            default: 'High-risk referral enforcement is active',
                        })}
                    </p>
                    <p className="text-sm mt-1">
                        {t('referralManagement.report.enforcementDescription', {
                            default: 'Referrers marked high risk no longer grant new code signups, referral discounts, or referrer bonus payouts until they are cleared.',
                        })}
                    </p>
                </div>
            )}
            <div className="bg-white p-6 rounded-2xl shadow-card max-w-2xl mx-auto">
                <form onSubmit={handleSave} className="space-y-6">
                    <ToggleSwitch 
                        isEnabled={settings.isEnabled}
                        onToggle={handleToggle}
                        label={t('referralManagement.enableLabel')}
                        description={t('referralManagement.enableDescription')}
                    />

                    <div className={!settings.isEnabled ? 'opacity-50 pointer-events-none' : ''}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="referrerBonusPoints" className="block text-sm font-medium text-slate-700">{t('referralManagement.referrerBonusLabel')}</label>
                                <p className="text-xs text-slate-500 mb-1">{t('referralManagement.referrerBonusDescription')}</p>
                                <input
                                    type="number"
                                    id="referrerBonusPoints"
                                    name="referrerBonusPoints"
                                    value={settings.referrerBonusPoints}
                                    onChange={handleInputChange}
                                    min="0"
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    disabled={!settings.isEnabled}
                                />
                            </div>
                            <div>
                                <label htmlFor="refereeDiscountAmount" className="block text-sm font-medium text-slate-700">{t('referralManagement.refereeDiscountLabel')}</label>
                                <p className="text-xs text-slate-500 mb-1">{t('referralManagement.refereeDiscountDescription')}</p>
                                <input
                                    type="number"
                                    id="refereeDiscountAmount"
                                    name="refereeDiscountAmount"
                                    value={settings.refereeDiscountAmount}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    disabled={!settings.isEnabled}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t">
                        <button type="submit" disabled={isLoading} className="px-6 py-2 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90 flex items-center space-x-2 disabled:bg-slate-400">
                             {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{t('buttons.saving')}</span>
                                </>
                             ) : (
                                <>
                                    <Icon name="check" className="w-5 h-5" />
                                    <span>{t('referralManagement.saveButton')}</span>
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
                                <h2 className="text-2xl font-bold">{t('referralManagement.report.title', { default: 'Top referrers' })}</h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    {t('referralManagement.report.description', {
                                        default: 'Users whose referrals have reached a paid first order and triggered a real bonus.',
                                    })}
                                </p>
                            </div>
                            <div className="text-right text-sm text-slate-500">
                                <div>{t('referralManagement.report.bonusesAwarded', { default: 'Bonuses awarded' })}: <span className="font-semibold text-slate-800">{overview.total_referral_bonuses_awarded}</span></div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="text-xs uppercase bg-slate-100 text-slate-700">
                                    <tr>
                                        <th className="px-4 py-3">{t('referralManagement.report.table.user', { default: 'User' })}</th>
                                        <th className="px-4 py-3">{t('referralManagement.report.table.code', { default: 'Referral code' })}</th>
                                        <th className="px-4 py-3">{t('referralManagement.report.table.successfulReferrals', { default: 'Successful referrals' })}</th>
                                        <th className="px-4 py-3">{t('referralManagement.report.table.bonusPoints', { default: 'Bonus points' })}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {overview.top_referrers.map((referrer) => (
                                        <tr key={referrer.user_id} className="border-b last:border-b-0">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900">{referrer.user_name}</div>
                                                <div className="text-xs text-slate-500">{referrer.user_email}</div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">{referrer.referral_code || '-'}</td>
                                            <td className="px-4 py-3">{referrer.successful_referrals}</td>
                                            <td className="px-4 py-3 font-semibold text-blue-700">{referrer.total_bonus_points_awarded}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {overview.top_referrers.length === 0 && (
                            <p className="text-sm text-slate-500 mt-4">{t('referralManagement.report.empty', { default: 'No successful referrers recorded yet.' })}</p>
                        )}
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-card">
                            <h2 className="text-2xl font-bold mb-1">{t('referralManagement.report.watchlistTitle', { default: 'Referral watchlist' })}</h2>
                            <p className="text-sm text-slate-500 mb-4">
                                {t('referralManagement.report.watchlistDescription', {
                                    default: 'Heuristic attention flags based on referral volume and incomplete conversion patterns.',
                                })}
                            </p>
                            <div className="space-y-3">
                                {overview.watchlist.map((entry) => (
                                    <div key={entry.referrer_user_id} className="rounded-xl border border-slate-200 px-4 py-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="font-medium text-slate-900">{entry.referrer_user_name}</div>
                                                <div className="text-xs text-slate-500">{entry.referrer_user_email}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                                                    {entry.attention_reason.replaceAll('_', ' ')}
                                                </span>
                                                {isHighRisk(entry.review_status) && (
                                                    <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-800">
                                                        {t('referralManagement.report.benefitsBlocked', { default: 'Benefits blocked' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                                            <div>{t('referralManagement.report.table.code', { default: 'Referral code' })}: <span className="font-mono text-slate-700">{entry.referral_code || '-'}</span></div>
                                            <div>{t('referralManagement.report.totalReferredUsers', { default: 'Referred users' })}: <span className="text-slate-700">{entry.total_referred_users}</span></div>
                                            <div>{t('referralManagement.report.signedUpOnly', { default: 'Signed up only' })}: <span className="text-slate-700">{entry.signed_up_only_count}</span></div>
                                            <div>{t('referralManagement.report.pendingBonus', { default: 'Pending bonus' })}: <span className="text-slate-700">{entry.pending_bonus_count}</span></div>
                                            <div>{t('referralManagement.report.completedConversions', { default: 'Completed conversions' })}: <span className="text-slate-700">{entry.completed_conversion_count}</span></div>
                                            <div>{t('referralManagement.report.reviewStatus', { default: 'Review status' })}: <span className="text-slate-700">{entry.review_status || 'unreviewed'}</span></div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleReviewStatus(entry.referrer_user_id, 'clear')}
                                                disabled={reviewLoadingId === entry.referrer_user_id}
                                                className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                                            >
                                                {t('referralManagement.report.markClear', { default: 'Mark clear' })}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleReviewStatus(entry.referrer_user_id, 'monitor')}
                                                disabled={reviewLoadingId === entry.referrer_user_id}
                                                className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200 disabled:opacity-50"
                                            >
                                                {t('referralManagement.report.markMonitor', { default: 'Mark monitor' })}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleReviewStatus(entry.referrer_user_id, 'reviewed_high_risk')}
                                                disabled={reviewLoadingId === entry.referrer_user_id}
                                                className="rounded-lg bg-rose-100 px-3 py-1 text-xs font-medium text-rose-800 hover:bg-rose-200 disabled:opacity-50"
                                            >
                                                {t('referralManagement.report.markHighRisk', { default: 'Mark high risk' })}
                                            </button>
                                        </div>
                                        {entry.review_note && (
                                            <p className="mt-2 text-xs text-slate-500">
                                                {t('referralManagement.report.reviewNote', { default: 'Review note' })}: <span className="text-slate-700">{entry.review_note}</span>
                                            </p>
                                        )}
                                        {isHighRisk(entry.review_status) && (
                                            <p className="mt-2 text-xs text-rose-700">
                                                {t('referralManagement.report.benefitsBlockedDescription', {
                                                    default: 'This referrer is actively blocked from granting new referral signups, discounts, and bonus rewards.',
                                                })}
                                            </p>
                                        )}
                                    </div>
                                ))}
                                {overview.watchlist.length === 0 && (
                                    <p className="text-sm text-slate-500">{t('referralManagement.report.watchlistEmpty', { default: 'No referrers currently require attention.' })}</p>
                                )}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-card">
                            <h2 className="text-2xl font-bold mb-1">{t('referralManagement.report.recentConversionsTitle', { default: 'Recent referral conversions' })}</h2>
                            <p className="text-sm text-slate-500 mb-4">
                                {t('referralManagement.report.recentConversionsDescription', {
                                    default: 'Most recent referred users with discount usage and bonus award state.',
                                })}
                            </p>
                            <div className="space-y-3">
                                {overview.recent_conversions.map((conversion) => (
                                    <div key={conversion.referred_user_id} className="rounded-xl border border-slate-200 px-4 py-3">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <div className="font-medium text-slate-900">{conversion.referred_user_name}</div>
                                                <div className="text-xs text-slate-500">{conversion.referred_user_email}</div>
                                            </div>
                                            <div className="text-right text-xs text-slate-500">
                                                <div>{t('referralManagement.report.referredBy', { default: 'Referred by' })}</div>
                                                <div className="font-medium text-slate-800">{conversion.referrer_user_name}</div>
                                            </div>
                                        </div>
                                        {overview.watchlist.some(
                                            (entry) => entry.referrer_user_id === conversion.referrer_user_id && isHighRisk(entry.review_status)
                                        ) && (
                                            <div className="mt-2 inline-flex rounded-full bg-rose-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-800">
                                                {t('referralManagement.report.benefitsBlocked', { default: 'Benefits blocked' })}
                                            </div>
                                        )}
                                        <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-500">
                                            <div>{t('referralManagement.report.codeUsed', { default: 'Code' })}: <span className="font-mono text-slate-700">{conversion.referral_code || '-'}</span></div>
                                            <div>{t('referralManagement.report.discountUsedAt', { default: 'Discount used' })}: <span className="text-slate-700">{conversion.referral_discount_used_at ? new Date(conversion.referral_discount_used_at).toLocaleString() : '-'}</span></div>
                                            <div>{t('referralManagement.report.bonusAwardedAt', { default: 'Bonus awarded' })}: <span className="text-slate-700">{conversion.referral_bonus_awarded_at ? new Date(conversion.referral_bonus_awarded_at).toLocaleString() : '-'}</span></div>
                                        </div>
                                    </div>
                                ))}
                                {overview.recent_conversions.length === 0 && (
                                    <p className="text-sm text-slate-500">{t('referralManagement.report.recentConversionsEmpty', { default: 'No referral conversions recorded yet.' })}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
