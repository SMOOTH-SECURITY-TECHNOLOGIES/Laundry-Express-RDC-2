import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../Icon';

interface MarketingAssistantProps {
    onUsePromo: (promoData: any) => void;
}

const MarketingAssistant: React.FC<MarketingAssistantProps> = ({ onUsePromo }) => {
    const { t, generateMarketingPromo, regeneratePromoImage } = useAppContext();
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditingConcept, setIsEditingConcept] = useState(false);
    const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);

    const examples = {
        'dresses': t('partnerPromoManagement.assistant.example1'),
        'collection': t('partnerPromoManagement.assistant.example2'),
        'flash': t('partnerPromoManagement.assistant.example3'),
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setResult(null);
        setIsEditingConcept(false);
        try {
            const promoData = await generateMarketingPromo(prompt);
            setResult(promoData);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerateImage = async () => {
        if (!result) return;
        setIsRegeneratingImage(true);
        try {
            const { bannerImageUrl } = await regeneratePromoImage(result.promoCode, result.discountValue, result.discountType, result.bannerConcept);
            setResult((prev: any) => ({ ...prev, bannerImageUrl }));
        } catch (e) {
            console.error("Image regeneration failed:", e);
        } finally {
            setIsRegeneratingImage(false);
        }
    };
    
    const handleUsePromo = () => {
        if (!result) return;
        onUsePromo({
            code: result.promoCode,
            discountType: result.discountType,
            discountValue: result.discountValue,
        });
        setResult(null);
        setPrompt('');
    };

    const downloadBanner = () => {
        if (!result?.bannerImageUrl) return;
        const link = document.createElement('a');
        link.download = `promo-banner-${result.promoCode}.png`;
        link.href = result.bannerImageUrl;
        link.click();
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card mb-8 dark:border dark:border-slate-700">
            <div className="flex items-start sm:items-center space-x-3 mb-4">
                <Icon name="sparkles" className="w-8 h-8 text-purple-500 shrink-0" />
                <div>
                    <h2 className="text-2xl font-bold dark:text-slate-100">{t('partnerPromoManagement.assistant.title')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('partnerPromoManagement.assistant.description')}</p>
                </div>
            </div>
            <div className="space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-brand-blue"
                    placeholder={t('partnerPromoManagement.assistant.promptPlaceholder')}
                    disabled={isLoading}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); }}}
                />
                <div className="space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('partnerPromoManagement.assistant.tryThese')}</p>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(examples).map(([key, value]) => (
                            <button key={key} onClick={() => setPrompt(value)} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                {value}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full px-4 py-3 bg-brand-dark text-white font-bold rounded-lg hover:bg-opacity-90 flex items-center justify-center space-x-2 disabled:bg-slate-400"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{t('partnerPromoManagement.assistant.loading')}</span>
                        </>
                    ) : (
                        <>
                            <Icon name="sparkles" className="w-5 h-5"/>
                            <span>{t('partnerPromoManagement.assistant.generateButton')}</span>
                        </>
                    )}
                </button>
            </div>

            {result && !isLoading && (
                <div className="mt-6 pt-6 border-t dark:border-slate-700 animate-fade-in space-y-6">
                    <div>
                        <h3 className="text-lg font-bold dark:text-slate-100 flex items-center gap-2 mb-2"><Icon name="pencil" className="w-5 h-5"/> {t('partnerPromoManagement.assistant.marketingTextLabel')}</h3>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm text-slate-800 dark:text-slate-200">{result.marketingText}</div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-bold dark:text-slate-100 flex items-center gap-2 mb-2"><Icon name="photo" className="w-5 h-5"/> {t('partnerPromoManagement.assistant.bannerConceptLabel')}</h3>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            {isEditingConcept ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={result.bannerConcept}
                                        onChange={(e) => setResult((prev: any) => ({...prev, bannerConcept: e.target.value}))}
                                        rows={3}
                                        className="w-full p-2 border rounded bg-white dark:bg-slate-800 dark:border-slate-600 text-sm"
                                    />
                                    <div className="flex justify-end">
                                        <button onClick={() => setIsEditingConcept(false)} className="px-3 py-1 text-xs font-medium text-white bg-brand-blue rounded-md hover:bg-opacity-90">
                                            {t('partnerPromoManagement.assistant.doneButton', { default: 'Done' })}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-start gap-2">
                                    <p className="text-sm italic text-slate-600 dark:text-slate-300 flex-grow">"{result.bannerConcept}"</p>
                                    <button onClick={() => setIsEditingConcept(true)} className="p-1 text-slate-500 hover:text-brand-blue rounded-full shrink-0" aria-label="Edit concept">
                                        <Icon name="pencil" className="w-4 h-4"/>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {result.bannerImageUrl ? (
                        <div className="space-y-4">
                            <div className="overflow-hidden rounded-lg border dark:border-slate-600 shadow-inner relative">
                                <img src={result.bannerImageUrl} alt="Generated promo banner" className="w-full h-auto aspect-[16/9] bg-slate-200 dark:bg-slate-900"/>
                                {isRegeneratingImage && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                         <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                <button onClick={downloadBanner} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center space-x-2 text-sm">
                                    <Icon name="arrow-down-tray" className="w-5 h-5" />
                                    <span>{t('partnerPromoManagement.assistant.downloadButton')}</span>
                                </button>
                                <button onClick={handleRegenerateImage} disabled={isRegeneratingImage} className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center space-x-2 text-sm disabled:opacity-50">
                                    <Icon name="arrow-path" className="w-5 h-5" />
                                    <span>{t('partnerPromoManagement.assistant.regenerateImageButton', { default: 'Regenerate Image' })}</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                         <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800/50 text-yellow-800 dark:text-yellow-200 text-sm">
                            Image generation failed. You can edit the concept and try regenerating the image.
                        </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t dark:border-slate-600">
                        <button onClick={handleGenerate} className="px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center space-x-2">
                            <Icon name="arrow-path" className="w-5 h-5" />
                            <span>{t('partnerPromoManagement.assistant.newIdeaButton', { default: 'New Idea' })}</span>
                        </button>
                        <button onClick={handleUsePromo} className="px-4 py-3 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90 flex items-center justify-center space-x-2">
                            <Icon name="check" className="w-5 h-5"/>
                            <span>{t('partnerPromoManagement.assistant.usePromoButton')}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketingAssistant;
