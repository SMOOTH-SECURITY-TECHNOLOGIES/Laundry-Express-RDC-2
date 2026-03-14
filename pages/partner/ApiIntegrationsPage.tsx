import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { WebhookEvent } from '../../types';
import { Icon } from '../../components/Icon';

interface PartnerIntegrations {
    apiKey?: string;
    webhookUrl?: string;
    subscribedWebhookEvents?: WebhookEvent[];
}

export const ApiIntegrationsPage: React.FC = () => {
    const { user, addNotification, t, apiRegeneratePartnerApiKey, apiUpdatePartnerWebhooks, apiFetchPartnerIntegrations } = useAppContext();
    
    const [integrations, setIntegrations] = useState<PartnerIntegrations>({});
    const [webhookUrl, setWebhookUrl] = useState('');
    const [subscribedEvents, setSubscribedEvents] = useState<WebhookEvent[]>([]);
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.partnerId) {
            setIsLoading(true);
            apiFetchPartnerIntegrations(user.partnerId)
                .then(data => {
                    setIntegrations(data);
                    setWebhookUrl(data.webhookUrl || '');
                    setSubscribedEvents(data.subscribedWebhookEvents || []);
                })
                .finally(() => setIsLoading(false));
        }
    }, [user, apiFetchPartnerIntegrations]);

    const handleCopy = () => {
        if (!integrations.apiKey) return;
        navigator.clipboard.writeText(integrations.apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGenerateNewKey = async () => {
        if (user?.partnerId && window.confirm(t('apiIntegrationsPage.apiKey.confirmGenerate'))) {
            // FIX: The return type is now { apiKey: string }
            const newKeyData = await apiRegeneratePartnerApiKey(user.partnerId);
            setIntegrations(prev => ({...prev, apiKey: newKeyData.apiKey}));
            addNotification(t('apiIntegrationsPage.apiKey.generateSuccess'), 'success');
        }
    };

    const handleWebhookSave = async () => {
        if (user?.partnerId) {
            setIsSaving(true);
            await apiUpdatePartnerWebhooks(user.partnerId, webhookUrl, subscribedEvents);
            addNotification(t('apiIntegrationsPage.webhooks.saveSuccess'), 'success');
            setIsSaving(false);
        }
    };

    const handleEventToggle = (event: WebhookEvent) => {
        setSubscribedEvents(prev => 
            prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
        );
    };
    
    const sendTestWebhook = async () => {
        if (!user?.partnerId || !integrations.webhookUrl) {
            addNotification("Please save a webhook URL first.", 'error');
            return;
        }
        console.log("Simulating sending a test webhook...");
        addNotification(t('apiIntegrationsPage.webhooks.testSuccess'), 'info');
    };

    if (isLoading) {
        return <div>Loading integration settings...</div>
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold dark:text-slate-100">{t('apiIntegrationsPage.title')}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">{t('apiIntegrationsPage.description')}</p>
            </div>

            {/* API Key Management */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <h2 className="text-2xl font-bold dark:text-slate-100">{t('apiIntegrationsPage.apiKey.title')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{t('apiIntegrationsPage.apiKey.description')}</p>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('apiIntegrationsPage.apiKey.yourKey')}</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                            type="text"
                            readOnly
                            value={integrations.apiKey || ''}
                            className="flex-1 block w-full rounded-none rounded-l-md p-2 border border-slate-300 bg-slate-50 font-mono text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300"
                        />
                        <button onClick={handleCopy} className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-100 text-sm font-semibold dark:bg-slate-600 dark:border-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-500">
                            {copied ? t('apiIntegrationsPage.apiKey.copied') : t('apiIntegrationsPage.apiKey.copy')}
                        </button>
                    </div>
                </div>
                <div className="mt-4">
                    <button onClick={handleGenerateNewKey} className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 dark:bg-red-900/40 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60">{t('apiIntegrationsPage.apiKey.generateNew')}</button>
                </div>
            </div>

            {/* Webhook Configuration */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <h2 className="text-2xl font-bold dark:text-slate-100">{t('apiIntegrationsPage.webhooks.title')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{t('apiIntegrationsPage.webhooks.description')}</p>
                <div className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="webhookUrl" className="block text-sm font-medium dark:text-slate-200">{t('apiIntegrationsPage.webhooks.endpointUrl')}</label>
                        <input
                            type="url"
                            id="webhookUrl"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            className="mt-1 w-full p-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                            placeholder={t('apiIntegrationsPage.webhooks.placeholder')}
                        />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium dark:text-slate-200">{t('apiIntegrationsPage.webhooks.subscribedEvents')}</h3>
                        <div className="mt-2 space-y-2">
                            {Object.values(WebhookEvent).map(event => (
                                <label key={event} className="flex items-start p-3 border rounded-lg has-[:checked]:bg-blue-50 has-[:checked]:border-brand-blue dark:border-slate-700 dark:has-[:checked]:bg-brand-blue/20 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={subscribedEvents.includes(event)}
                                        onChange={() => handleEventToggle(event)}
                                        className="mt-1 h-4 w-4 text-brand-blue rounded border-slate-300"
                                    />
                                    <div className="ml-3 text-sm">
                                        <p className="font-semibold dark:text-slate-100">{t(`apiIntegrationsPage.webhooks.events.${event}.label`)}</p>
                                        <p className="text-slate-500 dark:text-slate-400">{t(`apiIntegrationsPage.webhooks.events.${event}.description`)}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t dark:border-slate-700 flex justify-end space-x-2">
                     <button onClick={sendTestWebhook} className="px-4 py-2 text-sm font-medium text-brand-blue bg-blue-100 dark:bg-blue-900/40 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60">{t('apiIntegrationsPage.webhooks.test')}</button>
                    {/* FIX: The onClick handler was incomplete, causing a syntax error. It has been corrected to call `handleWebhookSave`. */}
                    <button onClick={handleWebhookSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90 disabled:bg-slate-400">
                        {isSaving ? t('buttons.saving') : t('buttons.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};