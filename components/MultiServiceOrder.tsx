

import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { Partner, Service, Article, ServiceItem, OrderItem, ServiceType } from '../types.ts';
import { Icon } from './Icon.tsx';
import { StainAnalysisModal } from './StainAnalysisModal.tsx';
// FIX: Using correct PascalCase for the implementation file import to resolve casing and export errors.
import { LaundryScannerModal } from './LaundryScannerModal';

interface MultiServiceOrderProps {
    partner: Partner;
    onNext: () => void;
    onBack: () => void;
}

const ArticleRow: React.FC<{
    article: Article;
    quantity: number;
    onQuantityChange: (change: number) => void;
}> = ({ article, quantity, onQuantityChange }) => (
    <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-lg border dark:border-slate-700">
        <div>
            <p className="font-semibold dark:text-slate-100">{article.name}</p>
            <p className="text-sm text-brand-blue font-bold mt-1">${article.price.toFixed(2)}</p>
        </div>
        <div className="flex items-center space-x-3">
            <button onClick={() => onQuantityChange(-1)} disabled={quantity === 0} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 text-lg font-bold flex items-center justify-center hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed">-</button>
            <span className="w-8 text-center font-semibold text-lg dark:text-slate-100">{quantity}</span>
            <button onClick={() => onQuantityChange(1)} className="w-8 h-8 rounded-full bg-brand-blue text-white text-lg font-bold flex items-center justify-center hover:bg-opacity-90">+</button>
        </div>
    </div>
);

export const MultiServiceOrder: React.FC<MultiServiceOrderProps> = ({ partner, onBack }) => {
    const { orderDraft, updateOrderDraft, services, t, addNotification } = useAppContext();
    const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
    const [isStainModalOpen, setIsStainModalOpen] = useState(false);
    const [scannerState, setScannerState] = useState<{ isOpen: boolean; service: Service | null }>({ isOpen: false, service: null });

// FIX: Enhanced partner services filtering with better error handling
    const partnerServices = useMemo(() => {
        if (!partner.serviceIds || !services) {
            return [];
        }

        const serviceIdSet = new Set(partner.serviceIds);
        return services.filter(s => serviceIdSet.has(s.id));
    }, [partner, services]);

// FIX: Enhanced service interaction with better debugging
    const handleServiceInteraction = useCallback((service: Service, quantityOrWeight?: number, article?: Article) => {
        if (!service || !service.id) {
            console.error('❌ Invalid service provided');
            return;
        }

        const newServiceItems = [...(orderDraft.serviceItems || [])];
        let serviceItem = newServiceItems.find(si => si.service.id === service.id);

        if (!serviceItem) {
            serviceItem = { service, items: [], weight: 0 };
            newServiceItems.push(serviceItem);
        }

        if (service.priceModel === 'per_kg') {
            serviceItem.weight = quantityOrWeight || 0;
        } else if (service.priceModel === 'per_item' && article && quantityOrWeight !== undefined) {
            if (!serviceItem.items) serviceItem.items = [];
            let articleItem = serviceItem.items.find(i => i.article.id === article.id);
            const currentQuantity = articleItem?.quantity || 0;
            const newQuantity = Math.max(0, currentQuantity + quantityOrWeight);

            if (!articleItem) {
                articleItem = { article, quantity: newQuantity };
                serviceItem.items.push(articleItem);
            } else {
                articleItem.quantity = newQuantity;
            }
            
            // Remove items with zero quantity
            serviceItem.items = serviceItem.items.filter(i => i.quantity > 0);
        }

        const finalServiceItems = newServiceItems.filter(si => 
            (si.weight && si.weight > 0) || 
            (si.items && si.items.length > 0)
        );
        
        updateOrderDraft({ serviceItems: finalServiceItems });

    }, [orderDraft.serviceItems, updateOrderDraft]);

    const handleStainAnalysisComplete = (suggestedService: ServiceType) => {
        setIsStainModalOpen(false);
        const suggestedServiceInstance = partnerServices.find(s => s.type === suggestedService);
        if (suggestedServiceInstance) {
            setExpandedServiceId(suggestedServiceInstance.id);
            addNotification(t('articleSelector.stainAnalysisRecommendation', { serviceType: t(`serviceType.${suggestedService}`) }), 'info');
        } else {
             addNotification(t('articleSelector.stainAnalysisComplete'), 'success');
        }
    };
    
// FIX: Enhanced scan results handler
    const handleScanResults = (scannedQuantities: { [articleName: string]: number }) => {
        const { service } = scannerState;
        if (!service) {
            console.error('❌ No service selected for scanning');
            addNotification(t('multiServiceOrder.scannerServiceMissing'), 'error');
            return;
        }

        const newServiceItems = [...(orderDraft.serviceItems || [])];
        let serviceItem = newServiceItems.find(si => si.service.id === service.id);

        if (!serviceItem) {
            serviceItem = { service, items: [], weight: 0 };
            newServiceItems.push(serviceItem);
        }

        if (!serviceItem.items) {
            serviceItem.items = [];
        }

        const availableArticles = service.articleCategories?.flatMap(cat => cat.items) || [];
        
        let matchesFound = 0;
        let totalItemsAdded = 0;

        // Process each scanned item
        for (const [scannedName, scannedQuantity] of Object.entries(scannedQuantities)) {
            // Enhanced matching with multiple strategies
            const matchedArticle = availableArticles.find(article => {
                const articleName = article.name.toLowerCase();
                const scannedNameLower = scannedName.toLowerCase();
                
                // Exact match
                if (articleName === scannedNameLower) return true;
                
                // Contains match
                if (articleName.includes(scannedNameLower) || scannedNameLower.includes(articleName)) return true;
                
                // Remove spaces and special characters for fuzzy matching
                const cleanArticleName = articleName.replace(/[^a-z0-9]/g, '');
                const cleanScannedName = scannedNameLower.replace(/[^a-z0-9]/g, '');
                if (cleanArticleName === cleanScannedName) return true;
                
                return false;
            });

            if (matchedArticle) {
                let existingItem = serviceItem.items.find(item => item.article.id === matchedArticle.id);
                const currentQuantity = existingItem?.quantity || 0;
                // FIX: Cast scannedQuantity to Number to resolve potential 'unknown' type issue from Object.entries
                const newQuantity = currentQuantity + Number(scannedQuantity);
                
                if (existingItem) {
                    existingItem.quantity = newQuantity;
                } else {
                    serviceItem.items.push({ article: matchedArticle, quantity: newQuantity });
                }
                
                matchesFound++;
                totalItemsAdded += Number(scannedQuantity);
            }
        }

        // Remove zero quantity items
        serviceItem.items = serviceItem.items.filter(item => item.quantity > 0);
        
        updateOrderDraft({ serviceItems: newServiceItems });
        setScannerState({ isOpen: false, service: null });

        // User feedback
        if (matchesFound > 0) {
            addNotification(
                t('multiServiceOrder.scannerSummary', { count: totalItemsAdded, matches: matchesFound }),
                'success'
            );
            
            // Auto-expand the service if items were added
            setExpandedServiceId(service.id);
        } else {
            // FIX: Changed notification type from 'warning' to 'info' as 'warning' is not a valid type.
            addNotification(
                t('multiServiceOrder.scannerNoMatchesDetailed'),
                'info'
            );
        }
    };
    
// FIX: Enhanced service item summary with better null checking
    const getServiceItemSummary = (serviceId: string) => {
        const serviceItem = orderDraft.serviceItems?.find(si => si.service.id === serviceId);
        if (!serviceItem) {
            return null;
        }

        if (serviceItem.service.priceModel === 'per_kg') {
            return { count: serviceItem.weight || 0, unit: 'kg' };
        } else if (serviceItem.service.priceModel === 'per_item') {
            const count = serviceItem.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            return { count, unit: `${count} items` };
        }
        return null;
    }

    const getTotalItemsCount = (serviceId: string): number => {
        const serviceItem = orderDraft.serviceItems?.find(si => si.service.id === serviceId);
        if (!serviceItem || serviceItem.service.priceModel !== 'per_item') return 0;
        return serviceItem.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    };

    // Show loading if services aren't ready
    if (partnerServices.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card dark:border dark:border-slate-700">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-slate-300">{t('multiServiceOrder.loadingServices')}</p>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-1 text-center">{t('multiServiceOrder.title')}</h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-6">{t('multiServiceOrder.subtitle', { name: partner.name })}</p>

            {/* Stain Analysis Banner */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800/50 mb-6 text-center">
                <p className="text-sm text-blue-800 dark:text-blue-200">{t('multiServiceOrder.stainHelperText')}</p>
                <button
                    onClick={() => setIsStainModalOpen(true)}
                    className="mt-2 px-4 py-2 bg-brand-cyan text-white font-semibold rounded-lg hover:bg-opacity-90 flex items-center justify-center space-x-2 mx-auto text-sm"
                >
                    <Icon name="magnifying-glass-plus" className="w-5 h-5" />
                    <span>{t('articleSelector.analyzeStain')}</span>
                </button>
            </div>

            {/* Selected Services Summary */}
            {orderDraft.serviceItems && orderDraft.serviceItems.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                        Selected Services
                    </h3>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        {orderDraft.serviceItems.map(serviceItem => {
                            const totalItems = getTotalItemsCount(serviceItem.service.id);
                            return (
                                <div key={serviceItem.service.id} className="flex justify-between">
                                    <span>{serviceItem.service.title}</span>
                                    <span className="font-semibold">
                                        {serviceItem.service.priceModel === 'per_kg' 
                                            ? `${serviceItem.weight}kg`
                                            : `${totalItems} items`
                                        }
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Services List */}
            <div className="space-y-4">
                {partnerServices.map(service => {
                    // FIX: Added proper service validation
                    if (!service || !service.id) {
                        console.error('❌ Invalid service in partnerServices:', service);
                        return null;
                    }

                    const isExpanded = expandedServiceId === service.id;
                    const summary = getServiceItemSummary(service.id);
                    const hasSelection = summary && summary.count > 0;
                    const totalItems = getTotalItemsCount(service.id);

                    if (service.priceModel === 'per_kg') {
                        return (
                            <div key={service.id} className={`p-4 border-2 rounded-lg transition-colors ${hasSelection ? 'border-brand-blue bg-blue-50 dark:bg-brand-blue/20' : 'bg-slate-50 dark:bg-slate-700/50 border-transparent'}`}>
                                <h3 className="font-bold text-lg dark:text-slate-100">{service.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{service.description}</p>
                                <div className="mt-4">
                                    <label htmlFor={`weight-${service.id}`} className="block text-sm font-medium dark:text-slate-300">
                                        {t('articleSelector.estimatedWeightKg')}
                                    </label>
                                    <input
                                        type="number"
                                        id={`weight-${service.id}`}
                                        value={summary?.count > 0 ? summary.count : ''}
                                        onChange={(e) => handleServiceInteraction(service, parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="0.5"
                                        className="mt-1 w-full max-w-xs p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg"
                                        placeholder={t('articleSelector.weightPlaceholder')}
                                    />
                                </div>
                            </div>
                        );
                    }
                    
                    return (
                        <div key={service.id} className={`border-2 rounded-lg transition-colors ${hasSelection ? 'border-brand-blue bg-blue-50 dark:bg-brand-blue/20' : 'bg-slate-50 dark:bg-slate-700/50 border-transparent'}`}>
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg dark:text-slate-100">{service.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{service.description}</p>
                                    </div>
                                    {hasSelection && (
                                        <div className="font-semibold text-brand-blue bg-white dark:bg-slate-600 px-3 py-1 rounded-full text-sm">
                                            {totalItems} items
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2 items-center">
                                    <button
                                        onClick={() => setExpandedServiceId(isExpanded ? null : service.id)}
                                        className="px-4 py-2 bg-brand-dark text-white font-semibold rounded-lg hover:bg-opacity-90 flex items-center space-x-2 text-sm"
                                    >
                                        <Icon name={isExpanded ? 'xmark' : 'list'} className="w-5 h-5" />
                                        <span>{t('multiServiceOrder.selectItems')}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setScannerState({ isOpen: true, service });
                                        }}
                                        className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 flex items-center space-x-2 text-sm"
                                    >
                                        <Icon name="camera" className="w-5 h-5" />
                                        <span>{t('multiServiceOrder.scanItemsButton')}</span>
                                    </button>
                                </div>
                            </div>
                            {isExpanded && (
                                <div className="p-4 border-t dark:border-slate-600 space-y-2">
                                    {service.articleCategories?.map(category => (
                                        <div key={category.name} className="space-y-2">
                                            <h4 className="font-semibold text-md dark:text-slate-200 pt-2">{category.name}</h4>
                                            {category.items.map(article => {
                                                const serviceItem = orderDraft.serviceItems?.find(si => si.service.id === service.id);
                                                const quantity = serviceItem?.items?.find(i => i.article.id === article.id)?.quantity || 0;
                                                return (
                                                    <ArticleRow 
                                                        key={article.id}
                                                        article={article}
                                                        quantity={quantity}
                                                        onQuantityChange={(change) => handleServiceInteraction(service, change, article)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-start pt-8 mt-8 border-t dark:border-slate-700">
                <button onClick={onBack} className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-700">
                {t('multiServiceOrder.changePartner')}
                </button>
            </div>
        </div>
        <StainAnalysisModal
            isOpen={isStainModalOpen}
            onClose={() => setIsStainModalOpen(false)}
            onComplete={handleStainAnalysisComplete}
        />
        {scannerState.isOpen && scannerState.service && (
            <LaundryScannerModal
                isOpen={scannerState.isOpen}
                onClose={() => setScannerState({ isOpen: false, service: null })}
                onScanComplete={handleScanResults}
                availableArticles={scannerState.service.articleCategories?.flatMap(cat => cat.items) || []}
            />
        )}
        </>
    );
};
