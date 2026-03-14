
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import type { Article, OrderItem, ServiceType, ServiceItem } from '../types.ts';
// FIX: Using correct PascalCase for the implementation file import to resolve casing and export errors.
import { LaundryScannerModal } from './LaundryScannerModal';
import { Icon } from './Icon.tsx';
import { StainAnalysisModal } from './StainAnalysisModal.tsx';

interface ArticleSelectorProps {
  onNext: () => void;
  onBack: () => void;
}

export const ArticleSelector: React.FC<ArticleSelectorProps> = ({ onNext, onBack }) => {
  const { orderDraft, updateOrderDraft, addNotification, t } = useAppContext();
  const service = orderDraft.serviceItems?.[0]?.service;

  const [quantities, setQuantities] = useState<{ [key: string]: number }>(() => {
    const initial: { [key: string]: number } = {};
    if (orderDraft.serviceItems?.[0]?.items && service?.priceModel === 'per_item') {
      orderDraft.serviceItems[0].items.forEach(item => {
        initial[item.article.id] = item.quantity;
      });
    }
    return initial;
  });

  const [weight, setWeight] = useState(orderDraft.serviceItems?.[0]?.weight || 0);
  const [openCategory, setOpenCategory] = useState<string | null>(() => {
    return service?.articleCategories?.[0]?.name || null;
  });
  const [prevServiceId, setPrevServiceId] = useState(service?.id);

  if (service?.id !== prevServiceId) {
    setPrevServiceId(service?.id);
    if (service?.articleCategories && (!openCategory || !service.articleCategories.find(c => c.name === openCategory))) {
      setOpenCategory(service.articleCategories[0].name);
    }
  }

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isStainModalOpen, setIsStainModalOpen] = useState(false);

  const calculateTotal = useMemo(() => {
    if (service?.priceModel === 'per_kg') {
      return (weight || 0) * (service.price || 0);
    }
    if (service?.priceModel === 'per_item' && service.articleCategories) {
      return service.articleCategories
        .flatMap(category => category.items)
        .reduce((total, article) => {
          const quantity = quantities[article.id] || 0;
          return total + (quantity * article.price);
        }, 0);
    }
    return 0;
  }, [quantities, weight, service]);

  const handleQuantityChange = (article: Article, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [article.id]: Math.max(0, (prev[article.id] || 0) + change)
    }));
  };

  const handleNext = () => {
    const currentServiceItem = orderDraft.serviceItems?.[0];
    if (!currentServiceItem) return;

    if (service?.priceModel === 'per_kg') {
      const updatedServiceItem: ServiceItem = { ...currentServiceItem, weight, items: [] };
      updateOrderDraft({ serviceItems: [updatedServiceItem], totalPrice: calculateTotal });
    } else {
      const items: OrderItem[] = service?.articleCategories
        ?.flatMap(category => category.items)
        .map(article => ({ article, quantity: quantities[article.id] || 0 }))
        .filter(item => item.quantity > 0) || [];
      const updatedServiceItem: ServiceItem = { ...currentServiceItem, items, weight: 0 };
      updateOrderDraft({ serviceItems: [updatedServiceItem], totalPrice: calculateTotal });
    }
    onNext();
  };
  
  const handleScanResults = (scannedQuantities: { [articleName: string]: number }) => {
    const allArticles = service?.articleCategories?.flatMap(cat => cat.items) || [];
    const newQuantities: { [key: string]: number } = { ...quantities };
    let matchesFound = 0;

    for (const [scannedName, qty] of Object.entries(scannedQuantities)) {
      // Improved matching: exact match or includes with lowercase
      const article = allArticles.find(a => 
        a.name.toLowerCase() === scannedName.toLowerCase() || 
        a.name.toLowerCase().includes(scannedName.toLowerCase()) ||
        scannedName.toLowerCase().includes(a.name.toLowerCase())
      );
      
      if (article) {
        newQuantities[article.id] = (newQuantities[article.id] || 0) + Number(qty);
        matchesFound++;
      }
    }

    setQuantities(newQuantities);
    setIsScannerOpen(false);
    if (matchesFound > 0) {
        addNotification(t('notifications.scanSuccess', { count: matchesFound }), 'success');
    } else {
        addNotification(t('notifications.scanNoMatches'), 'info');
    }
  };

  const handleStainAnalysisComplete = (suggestedService: ServiceType) => {
    setIsStainModalOpen(false);
    if (!orderDraft.serviceType) {
        updateOrderDraft({ serviceType: suggestedService });
        onBack();
        onBack();
    } else if (orderDraft.serviceType !== suggestedService) {
        addNotification(t('notifications.stainAnalysisRecommendation', { serviceType: suggestedService }), 'info');
    } else {
        addNotification(t('notifications.stainAnalysisComplete'), 'success');
    }
  };

  if (!service) return <div className="text-center p-12"><p>{t('articleSelector.noServiceSelected')}</p></div>;

  return (
    <>
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-center text-brand-dark dark:text-slate-100">
          {service.priceModel === 'per_kg' ? t('articleSelector.estimateWeight') : t('articleSelector.selectArticles')}
        </h2>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {service.priceModel === 'per_item' && (
                <button
                    onClick={() => setIsScannerOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-brand-dark text-white font-bold rounded-full text-base hover:bg-opacity-90 transform hover:scale-105 transition-all flex items-center justify-center space-x-2 shadow-md"
                >
                    <Icon name="camera" className="w-6 h-6" />
                    <span>{t('articleSelector.scanWithCamera')}</span>
                </button>
            )}
            <button
                onClick={() => setIsStainModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3 bg-brand-cyan text-white font-bold rounded-full text-base hover:bg-opacity-90 transform hover:scale-105 transition-all flex items-center justify-center space-x-2 shadow-md"
            >
                <Icon name="magnifying-glass-plus" className="w-6 h-6" />
                <span>{t('articleSelector.analyzeStain')}</span>
            </button>
        </div>
        
        {service.priceModel === 'per_kg' ? (
          <div className="max-w-sm mx-auto p-6 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border dark:border-slate-600">
            <label htmlFor="weight" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('articleSelector.estimatedWeightKg')}
            </label>
            <input
              type="number" id="weight" value={weight || ''}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full p-4 text-2xl font-bold text-center border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-brand-blue focus:border-brand-blue dark:bg-slate-800 dark:text-white"
              placeholder="0.0" min="0" step="0.5"
            />
            <p className="text-sm text-center text-slate-500 mt-4">{t('articleSelector.pricePerKg', { price: service.price?.toFixed(2) })}</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
            {service.articleCategories?.map(category => (
              <div key={category.name} className="border rounded-xl overflow-hidden bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
                <button
                  onClick={() => setOpenCategory(openCategory === category.name ? null : category.name)}
                  className="w-full flex justify-between items-center p-4 text-left bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="font-bold text-brand-dark dark:text-slate-100">{category.name}</span>
                  <Icon name={openCategory === category.name ? "xmark" : "bars3"} className="w-5 h-5 text-slate-500" />
                </button>
                {openCategory === category.name && (
                  <div className="p-4 space-y-3 animate-fade-in">
                    {category.items.map(article => (
                      <div key={article.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <div className="flex-grow">
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{article.name}</p>
                          <p className="text-sm text-brand-blue font-bold">${article.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <button onClick={() => handleQuantityChange(article, -1)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-sm border dark:border-slate-600 flex items-center justify-center hover:bg-slate-50 transition-all">-</button>
                          <span className="w-8 text-center font-bold text-lg">{quantities[article.id] || 0}</span>
                          <button onClick={() => handleQuantityChange(article, 1)} className="w-10 h-10 rounded-full bg-brand-blue text-white shadow-md flex items-center justify-center hover:bg-opacity-90 transition-all">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t dark:border-slate-700 flex justify-between">
          <button onClick={onBack} className="px-6 py-3 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            {t('common.back')}
          </button>
          <div className="text-right">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('articleSelector.estimatedTotal')}</p>
              <p className="text-2xl font-extrabold text-brand-blue mb-4">${calculateTotal.toFixed(2)}</p>
              <button onClick={handleNext} disabled={calculateTotal <= 0} className="px-10 py-3 bg-brand-success text-white font-bold rounded-xl hover:bg-opacity-90 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed shadow-lg transition-all">
                {t('common.next')}
              </button>
          </div>
        </div>
      </div>
      
      <LaundryScannerModal
        isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)}
        onScanComplete={handleScanResults}
        availableArticles={service.articleCategories?.flatMap(cat => cat.items) || []}
      />

      <StainAnalysisModal
        isOpen={isStainModalOpen} onClose={() => setIsStainModalOpen(false)}
        onComplete={handleStainAnalysisComplete}
      />
    </>
  );
};
