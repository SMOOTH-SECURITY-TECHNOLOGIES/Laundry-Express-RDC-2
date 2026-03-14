import React, { useState, useEffect } from 'react';
import { Partner, PartnerType, PartnerFeatures } from '../types';
import { Icon } from './Icon';
import { useAppContext } from '../context/AppContext';

interface PartnerEditModalProps {
  partner: Partner;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPartner: Partner) => void;
}

export const PartnerEditModal: React.FC<PartnerEditModalProps> = ({ partner, isOpen, onClose, onSave }) => {
  const { t, user } = useAppContext();
  const [formData, setFormData] = useState<Partner>(partner);

  useEffect(() => {
    setFormData(partner);
  }, [partner]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' || name === 'reviewCount' ? parseFloat(value) : value,
    }));
  };
  
  const handleImageUrlChange = (index: number, value: string) => {
    const newImageUrls = [...formData.imageUrls];
    newImageUrls[index] = value;
    setFormData(prev => ({...prev, imageUrls: newImageUrls}));
  };
  
  const addImageUrl = () => {
    setFormData(prev => ({...prev, imageUrls: [...prev.imageUrls, '']}));
  };
  
  const removeImageUrl = (index: number) => {
    const newImageUrls = formData.imageUrls.filter((_, i) => i !== index);
    setFormData(prev => ({...prev, imageUrls: newImageUrls}));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleEnableAllFeatures = () => {
    if (!formData.enabledFeatures) return;
    const allEnabled = { ...formData.enabledFeatures };
    for (const key in allEnabled) {
      (allEnabled as any)[key] = true;
    }
    setFormData(prev => ({ ...prev, enabledFeatures: allEnabled as PartnerFeatures }));
  };

  const handleDisableAllFeatures = () => {
    if (!formData.enabledFeatures) return;
    const allDisabled = { ...formData.enabledFeatures };
    for (const key in allDisabled) {
      (allDisabled as any)[key] = false;
    }
    setFormData(prev => ({ ...prev, enabledFeatures: allDisabled as PartnerFeatures }));
  };

  const allFeatureKeys: (keyof PartnerFeatures)[] = [
    'promotions', 
    'financials', 
    'analytics', 
    'customDomain', 
    'customSubdomain', 
    'teamManagement', 
    'apiAccess', 
    'advancedAutomation', 
    'aiReviewAssistant',
    'invoiceGenerator'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full relative">
         <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-300 dark:hover:text-slate-100">
            <Icon name="xmark" className="w-6 h-6" />
        </button>
        <div className="p-8">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-slate-100 mb-6">Modifier le partenaire</h2>
            <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nom du partenaire</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700" />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Adresse</label>
                    <textarea name="address" id="address" rows={2} value={formData.address} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700"></textarea>
                </div>
                <div>
                    <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">URL de la vidéo de présentation (YouTube, Vimeo, etc.)</label>
                    <input type="url" name="videoUrl" id="videoUrl" value={formData.videoUrl || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700" placeholder="https://..."/>
                </div>
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Type de partenaire</label>
                    <select name="type" id="type" value={formData.type} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700">
                        <option value={PartnerType.PRESSING}>Pressing</option>
                        <option value={PartnerType.LAVANDIER}>Lavandier</option>
                    </select>
                </div>
                
                {/* Admin-only section for feature management */}
                {user && (user.role === 'admin' || user.role === 'superadmin') && (
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Admin Controls</h3>
                        
                        {formData.enabledFeatures?.customSubdomain && (
                             <div>
                                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Slug (for subdomain.laundry.app)</label>
                                <input type="text" name="slug" id="slug" value={formData.slug || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700" placeholder="e.g., prestige-pressing"/>
                            </div>
                        )}

                        {formData.enabledFeatures?.customDomain && (
                            <div>
                                <label htmlFor="customDomain" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Domaine Personnalisé</label>
                                <input type="text" name="customDomain" id="customDomain" value={formData.customDomain || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700" placeholder="www.monpressing.com"/>
                            </div>
                        )}

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('partnerFeatures.title', { default: 'Enabled Features' })}</label>
                                <div className="flex space-x-2">
                                    <button type="button" onClick={handleEnableAllFeatures} className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                                        {t('partnerEditModal.enableAll', { default: 'Enable All' })}
                                    </button>
                                    <button type="button" onClick={handleDisableAllFeatures} className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                                        {t('partnerEditModal.disableAll', { default: 'Disable All' })}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border dark:border-slate-600 grid grid-cols-2 gap-2">
                                {allFeatureKeys.map((key) => (
                                    <div key={key} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`feature-${key}`}
                                            checked={formData.enabledFeatures?.[key as keyof PartnerFeatures] || false}
                                            onChange={(e) => {
                                                const { checked } = e.target;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    enabledFeatures: {
                                                        ...(prev.enabledFeatures!),
                                                        [key]: checked
                                                    }
                                                }));
                                            }}
                                            className="h-4 w-4 text-brand-blue rounded border-gray-300 focus:ring-brand-blue"
                                        />
                                        <label htmlFor={`feature-${key}`} className="ml-3 block text-sm text-gray-900 dark:text-slate-200 capitalize">
                                            {t(`partnerFeatures.${key}`, { default: key })}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}


                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">URLs des images de bannière</label>
                    <div className="space-y-2">
                        {formData.imageUrls.map((url, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input 
                                    type="text" 
                                    value={url} 
                                    onChange={(e) => handleImageUrlChange(index, e.target.value)} 
                                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                                    placeholder="https://example.com/image.png"
                                />
                                <button type="button" onClick={() => removeImageUrl(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full dark:hover:bg-red-900/40">
                                    <Icon name="xmark" className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addImageUrl} className="mt-2 text-sm font-semibold text-brand-blue hover:underline">
                        + Ajouter une autre image
                    </button>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="rating" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Note</label>
                        <input type="number" step="0.1" name="rating" id="rating" value={formData.rating} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700" />
                    </div>
                     <div>
                        <label htmlFor="reviewCount" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nombre d'avis</label>
                        <input type="number" name="reviewCount" id="reviewCount" value={formData.reviewCount} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700" />
                    </div>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-slate-600 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500">
                        Annuler
                    </button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90">
                        Enregistrer
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};