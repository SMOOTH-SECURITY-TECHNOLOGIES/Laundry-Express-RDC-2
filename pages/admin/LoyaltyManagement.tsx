
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { LoyaltySettings } from '../../types';
import { Icon } from '../../components/Icon';

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

    useEffect(() => {
        setSettings(loyaltySettings);
    }, [loyaltySettings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    };

    const handleToggle = () => {
        setSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateLoyaltySettings(settings);
            // The success notification is already in the context function.
        } catch (error) {
            addNotification(t('notifications.settingsSaveError'), 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">{t('loyaltyManagement.title')}</h1>
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
                                    <span>{t('loyaltyManagement.saveButton')}</span>
                                </>
                             )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};