import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { TrackingSettings } from '../../types';
import { Icon } from '../../components/Icon';

export const TrackingManagement: React.FC = () => {
    const { trackingSettings, updateTrackingSettings, addNotification, t } = useAppContext();
    const [settings, setSettings] = useState<TrackingSettings>(trackingSettings);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setSettings(trackingSettings);
    }, [trackingSettings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value.trim() }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateTrackingSettings(settings);
            addNotification(t('trackingManagement.settingsSaved'), 'success');
        } catch (error) {
            addNotification('Error saving settings', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold dark:text-slate-100">{t('trackingManagement.title')}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">{t('trackingManagement.description')}</p>
            </div>
            
            <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
                {/* Google Tag Manager */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                    <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">{t('trackingManagement.gtm.title')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('trackingManagement.gtm.description')}</p>
                    <div>
                        <label htmlFor="gtmContainerId" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('trackingManagement.gtm.label')}</label>
                        <input
                            type="text"
                            id="gtmContainerId"
                            name="gtmContainerId"
                            value={settings.gtmContainerId || ''}
                            onChange={handleInputChange}
                            className="mt-1 w-full p-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 font-mono"
                            placeholder={t('trackingManagement.gtm.placeholder')}
                        />
                    </div>
                </div>

                {/* Meta Pixel */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                    <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">{t('trackingManagement.meta.title')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('trackingManagement.meta.description')}</p>
                    <div>
                        <label htmlFor="metaPixelId" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('trackingManagement.meta.label')}</label>
                        <input
                            type="text"
                            id="metaPixelId"
                            name="metaPixelId"
                            value={settings.metaPixelId || ''}
                            onChange={handleInputChange}
                            className="mt-1 w-full p-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 font-mono"
                            placeholder={t('trackingManagement.meta.placeholder')}
                        />
                    </div>
                </div>
                
                <div className="flex justify-end pt-4 border-t dark:border-slate-700">
                    <button type="submit" disabled={isLoading} className="px-6 py-3 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90 flex items-center space-x-2 disabled:bg-slate-400">
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>{t('buttons.saving')}</span>
                            </>
                        ) : (
                            <>
                                <Icon name="check" className="w-5 h-5" />
                                <span>{t('trackingManagement.saveButton')}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};