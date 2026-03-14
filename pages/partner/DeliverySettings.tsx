import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { DeliverySettings as DeliverySettingsType } from '../../types';
import { Icon } from '../../components/Icon';

const predefinedCommunes = ['Gombe', 'Ngaliema', 'Lingwala', 'Kintambo', 'Bandalungwa', 'Kalamu', 'Masina', 'Limete', 'Barumbu', 'Kinshasa', 'Kasa-Vubu', 'Ngiri-Ngiri', 'Makala', 'Bumbu', 'Selembao', 'Ngaba', 'Lemba', 'Matete', 'Kisenso', 'Mont-Ngafula', 'Nsele', 'Maluku'];

export const DeliverySettings: React.FC = () => {
    const { user, partners, apiUpdatePartnerDeliverySettings, t, addNotification } = useAppContext();
    const partner = partners.find(p => p.id === user?.partnerId);

    const defaultSettings: DeliverySettingsType = {
        model: 'platform',
        zones: [],
        ownDrivers: [],
    };
    
    const [settings, setSettings] = useState<DeliverySettingsType>(partner?.deliverySettings || defaultSettings);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (partner) {
            setSettings(partner.deliverySettings || defaultSettings);
        }
    }, [partner]);

    const handleModelChange = (model: 'platform' | 'self') => {
        setSettings(prev => ({...prev, model}));
    };

    const handleZoneFeeChange = (commune: string, fee: string) => {
        const numericFee = parseFloat(fee);
        if (isNaN(numericFee) && fee !== '') return;

        setSettings(prev => {
            const newZones = [...prev.zones];
            const zoneIndex = newZones.findIndex(z => z.commune === commune);
            if (zoneIndex > -1) {
                newZones[zoneIndex].fee = numericFee;
            } else {
                newZones.push({ commune, fee: numericFee });
            }
            return {...prev, zones: newZones};
        });
    };

    const isZoneEnabled = (commune: string) => {
        return settings.zones.some(z => z.commune === commune);
    };

    const handleZoneToggle = (commune: string) => {
        setSettings(prev => {
            if (isZoneEnabled(commune)) {
                return {...prev, zones: prev.zones.filter(z => z.commune !== commune)};
            } else {
                return {...prev, zones: [...prev.zones, { commune, fee: 0 }]};
            }
        });
    };

    const handleSave = async () => {
        if (!partner) return;
        setIsSaving(true);
        try {
            await apiUpdatePartnerDeliverySettings(partner.id, settings);
            addNotification(t('deliverySettings.saveSuccess'), 'success');
        } catch(e) {
            addNotification(t('deliverySettings.saveError'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">{t('deliverySettings.title')}</h1>
                <p className="text-slate-500 mt-2 max-w-2xl">{t('deliverySettings.description')}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <h2 className="text-2xl font-bold mb-4">{t('deliverySettings.deliveryModel')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => handleModelChange('platform')} className={`p-6 border-2 rounded-lg text-left ${settings.model === 'platform' ? 'border-brand-blue bg-blue-50' : 'hover:border-slate-400'}`}>
                        <h3 className="font-bold text-lg flex items-center"><Icon name="truck" className="w-6 h-6 mr-2"/> {t('deliverySettings.platform.title')}</h3>
                        <p className="text-sm text-slate-600 mt-2">{t('deliverySettings.platform.description')}</p>
                    </button>
                    <button onClick={() => handleModelChange('self')} className={`p-6 border-2 rounded-lg text-left ${settings.model === 'self' ? 'border-brand-blue bg-blue-50' : 'hover:border-slate-400'}`}>
                        <h3 className="font-bold text-lg flex items-center"><Icon name="user" className="w-6 h-6 mr-2"/> {t('deliverySettings.self.title')}</h3>
                        <p className="text-sm text-slate-600 mt-2">{t('deliverySettings.self.description')}</p>
                    </button>
                </div>
            </div>

            {settings.model === 'self' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700 animate-fade-in">
                    <h2 className="text-2xl font-bold mb-4">{t('deliverySettings.zones.title')}</h2>
                    <p className="text-sm text-slate-500 mb-4">{t('deliverySettings.zones.description', { currency: partner?.currency })}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {predefinedCommunes.map(commune => {
                            const isEnabled = isZoneEnabled(commune);
                            const zone = settings.zones.find(z => z.commune === commune);
                            return (
                                <div key={commune} className={`p-4 rounded-lg border ${isEnabled ? 'bg-slate-50 border-slate-300' : 'bg-white'}`}>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor={`toggle-${commune}`} className="font-semibold">{commune}</label>
                                        <input
                                            type="checkbox"
                                            id={`toggle-${commune}`}
                                            checked={isEnabled}
                                            onChange={() => handleZoneToggle(commune)}
                                            className="h-4 w-4 rounded"
                                        />
                                    </div>
                                    {isEnabled && (
                                        <div className="mt-2">
                                            <label htmlFor={`fee-${commune}`} className="text-xs text-slate-500">{t('deliverySettings.zones.feeLabel')}</label>
                                            <input
                                                type="number"
                                                id={`fee-${commune}`}
                                                value={zone?.fee || ''}
                                                onChange={(e) => handleZoneFeeChange(commune, e.target.value)}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.5"
                                                className="w-full mt-1 p-1 border rounded"
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            
            <div className="flex justify-end pt-4 border-t">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90 flex items-center space-x-2 disabled:bg-slate-400"
                >
                     {isSaving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{t('buttons.saving')}</span>
                        </>
                     ) : (
                        <>
                            <Icon name="check" className="w-5 h-5" />
                            <span>{t('profilePage.saveChanges')}</span>
                        </>
                     )}
                </button>
            </div>
        </div>
    );
};
