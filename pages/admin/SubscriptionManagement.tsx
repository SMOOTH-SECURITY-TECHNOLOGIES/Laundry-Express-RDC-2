import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SubscriptionPlan, PartnerFeatures } from '../../types';
import { Icon } from '../../components/Icon';
import { SubscriptionPlanEditModal } from '../../components/admin/SubscriptionPlanEditModal';

const FeatureList: React.FC<{ features: Partial<PartnerFeatures> }> = ({ features }) => {
    const { t } = useAppContext();
    
    const allPossibleFeatures: (keyof PartnerFeatures)[] = [
        'promotions', 'financials', 'analytics', 'customDomain', 'customSubdomain',
        'teamManagement', 'apiAccess', 'advancedAutomation', 'aiReviewAssistant', 'invoiceGenerator'
    ];

    return (
        <ul className="space-y-2">
            {allPossibleFeatures.map(key => (
                <li key={key} className="flex items-center">
                    <Icon name="check" className={`w-5 h-5 mr-2 ${features[key] ? 'text-green-500' : 'text-slate-300'}`} />
                    <span className={`${features[key] ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 line-through'}`}>
                        {t(`partnerFeatures.${key}`, { defaultValue: key })}
                    </span>
                </li>
            ))}
        </ul>
    );
}

export const SubscriptionManagement: React.FC = () => {
    const { subscriptionPlans, t, updateSubscriptionPlan, addSubscriptionPlan } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [planToEdit, setPlanToEdit] = useState<SubscriptionPlan | null>(null);

    const handleOpenModal = (plan: SubscriptionPlan | null) => {
        setPlanToEdit(plan);
        setIsModalOpen(true);
    };

    const handleSavePlan = (plan: SubscriptionPlan) => {
        if (planToEdit) {
            updateSubscriptionPlan(plan);
        } else {
            addSubscriptionPlan(plan);
        }
        setIsModalOpen(false);
        setPlanToEdit(null);
    };

    return (
        <>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">{t('subscriptionManagement.title', { default: 'Subscription Plans' })}</h1>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                            {t('subscriptionManagement.backendDescription', {
                                default:
                                    'Subscription plans are now managed through the backend plan catalog. This proves real plan persistence, while full billing and partner subscription lifecycle remain a separate step.',
                            })}
                        </p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal(null)}
                        className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90 flex items-center space-x-2"
                    >
                        <Icon name="sparkles" className="w-5 h-5" />
                        <span>{t('subscriptionManagement.newPlan', { default: 'New Plan' })}</span>
                    </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-100 p-4 rounded-2xl">
                    <p className="font-semibold">
                        {t('subscriptionManagement.backendTitle', {
                            default: 'Backend-backed subscription plans',
                        })}
                    </p>
                    <p className="text-sm mt-1">
                        {t('subscriptionManagement.backendNotice', {
                            default:
                                'Plan creation and editing now persist through the backend subscription-plan catalog. Real partner billing, invoices, and lifecycle automation are still not yet proven here.',
                        })}
                    </p>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subscriptionPlans.map(plan => (
                        <div key={plan.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700 flex flex-col">
                            <h3 className="text-2xl font-bold text-brand-dark dark:text-slate-100">{plan.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>

                            <div className="my-6">
                                <span className="text-4xl font-extrabold dark:text-white">${plan.priceMonthly}</span>
                                <span className="text-slate-500 dark:text-slate-400">/ {t('subscription.monthly')}</span>
                            </div>

                            <div className="flex-grow">
                                <FeatureList features={plan.features} />
                            </div>
                            
                            <div className="mt-6 pt-4 border-t dark:border-slate-700">
                                 <button onClick={() => handleOpenModal(plan)} className="w-full px-4 py-2 text-sm font-medium text-brand-blue bg-blue-100 rounded-lg hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-200">
                                    {t('subscriptionManagement.editPlan', { default: 'Edit Plan' })}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <SubscriptionPlanEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                plan={planToEdit}
                onSave={handleSavePlan}
            />
        </>
    );
};
