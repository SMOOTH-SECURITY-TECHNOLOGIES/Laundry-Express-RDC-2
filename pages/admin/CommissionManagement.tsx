import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Partner, CommissionSettings, ServiceType, PartnerType } from '../../types';

export const CommissionManagement: React.FC = () => {
    const { partners, commissionSettings, updateCommissionSettings, updatePartner, t, addNotification } = useAppContext();
    const [settings, setSettings] = useState<CommissionSettings>(commissionSettings);
    const [partnerOverrides, setPartnerOverrides] = useState<{ [partnerId: string]: number | undefined }>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setSettings(commissionSettings);
        const initialOverrides: { [partnerId: string]: number | undefined } = {};
        partners.forEach(p => {
            initialOverrides[p.id] = p.commissionRate;
        });
        setPartnerOverrides(initialOverrides);
    }, [commissionSettings, partners]);

    const handleSettingsChange = (field: keyof CommissionSettings | `byServiceType.${ServiceType}`, value: string) => {
        const numericValue = parseFloat(value) / 100;
        if (isNaN(numericValue) || numericValue < 0 || numericValue > 1) return;

        setSettings(prev => {
            if (field.startsWith('byServiceType.')) {
                const serviceType = field.split('.')[1] as ServiceType;
                return {
                    ...prev,
                    byServiceType: {
                        ...prev.byServiceType,
                        [serviceType]: numericValue
                    }
                };
            }
            return { ...prev, [field]: numericValue };
        });
    };

    const handlePartnerOverrideChange = (partnerId: string, value: string) => {
        const numericValue = value === '' ? undefined : parseFloat(value) / 100;
        if (numericValue !== undefined && (isNaN(numericValue) || numericValue < 0 || numericValue > 1)) return;

        setPartnerOverrides(prev => ({
            ...prev,
            [partnerId]: numericValue
        }));
    };
    
    const getEffectiveCommission = (partner: Partner): number => {
        const partnerOverride = partnerOverrides[partner.id];
        if (partnerOverride !== undefined) {
            return partnerOverride;
        }
        
        let serviceTypeForPartner: ServiceType | undefined;
        if (partner.type === PartnerType.LAVANDIER) {
            serviceTypeForPartner = ServiceType.BLANCHISSERIE;
        } else if (partner.type === PartnerType.PRESSING) {
            serviceTypeForPartner = ServiceType.PRESSING;
        }
    
        const serviceTypeRate = serviceTypeForPartner ? settings.byServiceType[serviceTypeForPartner] : undefined;
        if (serviceTypeRate !== undefined) {
            return serviceTypeRate;
        }
        return settings.globalRate;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save global and service-type settings
            await updateCommissionSettings(settings);

            // Save partner-specific overrides that have changed
            const partnerUpdatePromises = partners
                .filter(p => {
                    const originalRate = p.commissionRate;
                    const newRate = partnerOverrides[p.id];
                    return originalRate !== newRate && (originalRate !== undefined || newRate !== undefined);
                })
                .map(p => {
                    const updatedPartner: Partner = { ...p, commissionRate: partnerOverrides[p.id] };
                    return updatePartner(updatedPartner);
                });

            await Promise.all(partnerUpdatePromises);

            addNotification('Commission settings saved successfully.', 'success');
        } catch (error) {
            addNotification('Failed to save commission settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-4">Commission Management</h2>
            <div className="space-y-6">
                {/* Global and Service Type Settings */}
                <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-700/50 dark:border-slate-700">
                    <h3 className="font-semibold text-lg mb-3">Default Rates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Global Default (%)</label>
                            <input
                                type="number"
                                value={(settings.globalRate * 100).toFixed(1)}
                                onChange={e => handleSettingsChange('globalRate', e.target.value)}
                                className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        {Object.values(ServiceType).map(type => {
                            const serviceTypeRate = settings.byServiceType[type];
                            return (
                             <div key={type}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t(`partnerTypeEnum.${type}`)} (%)</label>
                                <input
                                    type="number"
                                    value={serviceTypeRate !== undefined ? (serviceTypeRate * 100).toFixed(1) : ''}
                                    onChange={e => handleSettingsChange(`byServiceType.${type}`, e.target.value)}
                                    placeholder={(settings.globalRate * 100).toFixed(1)}
                                    className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            )
                        })}
                    </div>
                </div>

                {/* Per-Partner Overrides */}
                 <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-700/50 dark:border-slate-700">
                    <h3 className="font-semibold text-lg mb-3">Per-Partner Overrides</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {partners.map(partner => {
                            const overrideValue = partnerOverrides[partner.id];
                            const placeholderRate = (() => {
                                let st: ServiceType | undefined;
                                if (partner.type === PartnerType.LAVANDIER) st = ServiceType.BLANCHISSERIE;
                                else if (partner.type === PartnerType.PRESSING) st = ServiceType.PRESSING;

                                const rate = st ? settings.byServiceType[st] : undefined;
                                return (rate !== undefined ? rate : settings.globalRate) * 100;
                            })();
                            return (
                             <div key={partner.id} className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-5">
                                    <p className="font-medium text-slate-800 dark:text-slate-100">{partner.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t(`partnerTypeEnum.${partner.type}`)}</p>
                                </div>
                                <div className="col-span-3">
                                    <input
                                        type="number"
                                        value={overrideValue !== undefined ? (overrideValue * 100).toFixed(1) : ''}
                                        onChange={e => handlePartnerOverrideChange(partner.id, e.target.value)}
                                        placeholder={placeholderRate.toFixed(1)}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                                <div className="col-span-4 text-right">
                                    <span className="font-semibold text-brand-dark dark:text-slate-100">
                                        {(getEffectiveCommission(partner) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                           )
                        })}
                    </div>
                </div>
                
                <div className="flex justify-end pt-4">
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90 disabled:bg-slate-400">
                         {isSaving ? t('buttons.saving') : t('buttons.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};
