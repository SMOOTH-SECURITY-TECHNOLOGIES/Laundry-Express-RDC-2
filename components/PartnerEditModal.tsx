import React, { useState, useEffect } from 'react';
import { Partner } from '../types';
import { Icon } from './Icon';
import { useAppContext } from '../context/AppContext';

interface PartnerEditModalProps {
  partner: Partner;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPartner: Partner) => void | Promise<void>;
}

export const PartnerEditModal: React.FC<PartnerEditModalProps> = ({ partner, isOpen, onClose, onSave }) => {
  const { t } = useAppContext();
  const [formData, setFormData] = useState<Partner>(partner);
  const [isSaving, setIsSaving] = useState(false);

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
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await Promise.resolve(onSave(formData));
    } finally {
      setIsSaving(false);
    }
  };

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
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('partnerProfileManagement.editBackendNotice', { default: 'Cette modification met à jour les champs canoniques du profil partenaire: nom et adresse principale.' })}
                </p>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nom du partenaire</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700" />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Adresse</label>
                    <textarea name="address" id="address" rows={2} value={formData.address} onChange={handleChange} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700"></textarea>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-slate-600 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500">
                        Annuler
                    </button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90 disabled:opacity-60 disabled:cursor-not-allowed">
                        {isSaving ? t('buttons.saving') : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};
