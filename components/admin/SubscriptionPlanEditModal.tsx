import React, { useState, useEffect } from 'react';
import { SubscriptionPlan, PartnerFeatures } from '../../types';
import { Icon } from '../Icon';
import { useAppContext } from '../../context/AppContext';

interface SubscriptionPlanEditModalProps {
  plan: SubscriptionPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: SubscriptionPlan) => void;
}

export const SubscriptionPlanEditModal: React.FC<SubscriptionPlanEditModalProps> = ({ plan, isOpen, onClose, onSave }) => {
    const { t } = useAppContext();
    
    const isNewPlan = !plan;
    const initialPlanState: SubscriptionPlan = {
        id: `plan-${Date.now()}`,
        name: '',
        description: '',
        priceMonthly: 0,
        priceYearly: 0,
        isMostPopular: false,
        features: {},
    };

    const [formData, setFormData] = useState<SubscriptionPlan>(plan || initialPlanState);

    useEffect(() => {
        setFormData(plan || initialPlanState);
    }, [plan, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: (name.includes('price') ? parseFloat(value) : value) }));
        }
    };

    const handleFeatureToggle = (key: keyof PartnerFeatures) => {
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [key]: !prev.features[key],
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;
    
    const allPossibleFeatures = Object.keys(t('partnerFeatures', { returnObjects: true })) as (keyof PartnerFeatures)[];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full relative">
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-300 dark:hover:text-slate-100">
                    <Icon name="xmark" className="w-6 h-6" />
                </button>
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-brand-dark dark:text-slate-100 mb-6">{isNewPlan ? t('subscriptionManagement.newPlan') : t('subscriptionManagement.editPlan')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Plan Name</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Description</label>
                            <textarea name="description" id="description" value={formData.description} onChange={handleChange} required rows={2} className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="priceMonthly" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Monthly Price ($)</label>
                                <input type="number" name="priceMonthly" id="priceMonthly" value={formData.priceMonthly} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 disabled:bg-slate-100 dark:disabled:bg-slate-800/50" disabled={!isNewPlan} />
                            </div>
                             <div>
                                <label htmlFor="priceYearly" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Yearly Price ($)</label>
                                <input type="number" name="priceYearly" id="priceYearly" value={formData.priceYearly} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 disabled:bg-slate-100 dark:disabled:bg-slate-800/50" disabled={!isNewPlan} />
                            </div>
                        </div>
                        <div className="flex items-center">
                            <input type="checkbox" name="isMostPopular" id="isMostPopular" checked={!!formData.isMostPopular} onChange={handleChange} className="h-4 w-4 text-brand-blue rounded border-gray-300"/>
                            <label htmlFor="isMostPopular" className="ml-2 block text-sm text-gray-900 dark:text-slate-200">Mark as Most Popular</label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Features</label>
                            <div className="mt-2 grid grid-cols-2 gap-2 p-3 border rounded-lg bg-slate-50 dark:bg-slate-700/50 dark:border-slate-600">
                                {allPossibleFeatures.map(key => (
                                    <div key={key} className="flex items-center">
                                        <input type="checkbox" id={`feature-${key}`} checked={!!formData.features[key]} onChange={() => handleFeatureToggle(key)} className="h-4 w-4 text-brand-blue rounded border-gray-300"/>
                                        <label htmlFor={`feature-${key}`} className="ml-2 block text-sm text-gray-900 dark:text-slate-200">{t(`partnerFeatures.${key}`, { defaultValue: key })}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div className="flex justify-end space-x-4 pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-slate-600 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500">
                                {t('buttons.cancel')}
                            </button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90">
                                {t('buttons.save')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
