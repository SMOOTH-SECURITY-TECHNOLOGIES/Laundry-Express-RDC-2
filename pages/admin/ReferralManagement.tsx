import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ReferralSettings } from '../../types';
import { Icon } from '../../components/Icon';

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

    useEffect(() => {
        setSettings(referralSettings);
    }, [referralSettings]);

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
            <h1 className="text-3xl font-bold">{t('referralManagement.title')}</h1>
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
        </div>
    );
};