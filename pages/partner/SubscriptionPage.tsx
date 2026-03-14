import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SubscriptionPlan, PartnerFeatures, Invoice } from '../../types';
import { Icon } from '../../components/Icon';

const FeatureCheck: React.FC<{ included: boolean; label: string }> = ({ included, label }) => (
    <div className="flex items-center space-x-3">
        <Icon name="check" className={`w-5 h-5 ${included ? 'text-green-500' : 'text-slate-300'}`} />
        <span className={included ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 line-through'}>{label}</span>
    </div>
);

export const SubscriptionPage: React.FC = () => {
    const { user, partners, subscriptionPlans, invoices, t, apiSubscribePartner, addNotification } = useAppContext();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmingPlan, setConfirmingPlan] = useState<SubscriptionPlan | null>(null);

    const partner = useMemo(() => partners.find(p => p.id === user?.partnerId), [partners, user]);
    const partnerInvoices = useMemo(() => invoices.filter(i => i.partnerId === partner?.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [invoices, partner]);
    
    // This is simulated. In a real app, this would come from the partner's subscription data.
    const currentPlan = useMemo(() => subscriptionPlans.find(p => p.id === `plan-${partner?.id.slice(-1)}`), [subscriptionPlans, partner]);

    const handleSubscribe = async () => {
        if (!confirmingPlan) return;
        setIsLoading(true);
        try {
            await apiSubscribePartner(confirmingPlan.id, billingCycle);
            addNotification(t('subscription.subscribeSuccess', { planName: confirmingPlan.name }), 'success');
        } catch (error) {
            addNotification(t('subscription.subscribeError'), 'error');
        } finally {
            setIsLoading(false);
            setConfirmingPlan(null);
        }
    };
    
    const allFeatures: (keyof PartnerFeatures)[] = [
        'promotions', 'financials', 'analytics', 'customDomain', 'customSubdomain',
        'teamManagement', 'apiAccess', 'advancedAutomation', 'aiReviewAssistant'
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold dark:text-slate-100">{t('subscription.title', { default: 'Subscription & Billing' })}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">{t('subscription.subtitle', { default: 'Choose the plan that best fits your business needs.'})}</p>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center">
                <div className="flex p-1 rounded-full bg-slate-100 dark:bg-slate-700">
                    <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${billingCycle === 'monthly' ? 'bg-white text-brand-blue shadow-sm dark:bg-slate-900' : 'text-slate-600 dark:text-slate-300'}`}>
                        {t('subscription.monthly')}
                    </button>
                    <button onClick={() => setBillingCycle('yearly')} className={`px-4 py-1.5 text-sm font-semibold rounded-full relative ${billingCycle === 'yearly' ? 'bg-white text-brand-blue shadow-sm dark:bg-slate-900' : 'text-slate-600 dark:text-slate-300'}`}>
                        {t('subscription.yearly')}
                        <span className="absolute -top-2 -right-2 text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full transform rotate-12">{t('subscription.save20')}</span>
                    </button>
                </div>
            </div>

            {/* Pricing Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {subscriptionPlans.map(plan => {
                    const isCurrent = currentPlan?.id === plan.id;
                    const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
                    const isUpgrade = currentPlan && price > (billingCycle === 'monthly' ? currentPlan.priceMonthly : currentPlan.priceYearly);

                    return (
                        <div key={plan.id} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border-2 flex flex-col h-full ${isCurrent ? 'border-brand-blue' : 'dark:border-slate-700'} ${plan.isMostPopular ? 'transform scale-105' : ''}`}>
                             {plan.isMostPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">{t('subscription.mostPopular')}</div>}
                            <h3 className="text-2xl font-bold text-brand-dark dark:text-slate-100">{plan.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 h-10">{plan.description}</p>
                            <div className="my-6">
                                <span className="text-4xl font-extrabold dark:text-white">${price}</span>
                                <span className="text-slate-500 dark:text-slate-400">/ {billingCycle === 'monthly' ? t('subscription.month') : t('subscription.year')}</span>
                            </div>
                            <div className="space-y-3 flex-grow mb-6">
                                {allFeatures.map(key => (
                                    <FeatureCheck key={key} included={!!plan.features[key]} label={t(`partnerFeatures.${key}`)} />
                                ))}
                            </div>
                            <button 
                                onClick={() => setConfirmingPlan(plan)}
                                disabled={isCurrent}
                                className={`w-full py-3 font-semibold rounded-lg text-lg transition-colors ${isCurrent ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : isUpgrade ? 'bg-brand-success text-white' : 'bg-brand-blue text-white'}`}
                            >
                                {isCurrent ? t('subscription.currentPlan') : isUpgrade ? t('subscription.upgrade') : t('subscription.downgrade')}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            {/* Billing History */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <h2 className="text-2xl font-bold dark:text-slate-100 mb-4">{t('subscription.billingHistory.title')}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-slate-500 dark:text-slate-400">
                           <tr className="border-b dark:border-slate-700">
                               <th className="py-2 px-4">{t('subscription.billingHistory.date')}</th>
                               <th className="py-2 px-4">{t('subscription.billingHistory.plan')}</th>
                               <th className="py-2 px-4 text-right">{t('subscription.billingHistory.amount')}</th>
                               <th className="py-2 px-4 text-center">{t('subscription.billingHistory.status')}</th>
                           </tr>
                        </thead>
                        <tbody>
                            {partnerInvoices.map(invoice => (
                                <tr key={invoice.id} className="border-b dark:border-slate-700 last:border-0">
                                    <td className="py-3 px-4">{new Date(invoice.date).toLocaleDateString()}</td>
                                    <td className="py-3 px-4">{invoice.planName} ({t(`subscription.${invoice.billingCycle}`)})</td>
                                    <td className="py-3 px-4 text-right font-semibold">${invoice.amount.toFixed(2)}</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {t(`subscription.billingHistory.${invoice.status}`)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {partnerInvoices.length === 0 && <p className="text-center text-slate-500 py-8">{t('subscription.billingHistory.noInvoices')}</p>}
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmingPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 text-center">
                        <h3 className="text-xl font-bold dark:text-slate-100">{t('subscription.confirm.title', { planName: confirmingPlan.name })}</h3>
                        <p className="my-4 dark:text-slate-300">{t('subscription.confirm.description', { 
                            amount: (billingCycle === 'monthly' ? confirmingPlan.priceMonthly : confirmingPlan.priceYearly).toFixed(2),
                            cycle: t(`subscription.${billingCycle}`)
                        })}</p>
                        <div className="flex justify-center space-x-4">
                            <button onClick={() => setConfirmingPlan(null)} disabled={isLoading} className="px-6 py-2 bg-slate-200 dark:bg-slate-600 rounded-lg font-semibold">{t('buttons.cancel')}</button>
                            <button onClick={handleSubscribe} disabled={isLoading} className="px-6 py-2 bg-brand-success text-white rounded-lg font-semibold">
                                {isLoading ? t('buttons.loading') : t('subscription.confirm.confirmButton')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};