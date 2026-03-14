import React, { useState, useEffect } from 'react';
import { User, DrcAddress } from '../types';
import { Icon } from './Icon';
import { useAppContext } from '../context/AppContext';

interface ProfileEditModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  isSaving: boolean;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ user, isOpen, onClose, onSave, isSaving }) => {
  const { t } = useAppContext();
  const [formData, setFormData] = useState(user);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setFormData(user);
    setErrors({});
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        pickupAddress: {
          ...(prev.pickupAddress as DrcAddress),
          [name]: value,
        },
      }));
  };
  
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = t('validation.required');
    if (!formData.pickupAddress.commune?.trim()) (newErrors as any).commune = t('validation.required');
    if (!formData.pickupAddress.avenue?.trim()) (newErrors as any).avenue = t('validation.required');
    if (!formData.pickupAddress.numero?.trim()) (newErrors as any).numero = t('validation.required');
    
    const phoneRegex = /^08\d{8}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = t('validation.required');
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = t('validation.invalidPhone');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full relative animate-slide-up">
         <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-300 dark:hover:text-slate-100">
            <Icon name="xmark" className="w-6 h-6" />
        </button>
        <div className="p-8">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-slate-100 mb-6">{t('profilePage.editInfo')}</h2>
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('profilePage.name')}</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} onBlur={validate} required className={`w-full p-2 border rounded-lg focus:ring-brand-blue focus:border-brand-blue dark:bg-slate-700 ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('profilePage.phone')}</label>
                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} onBlur={validate} required className={`w-full p-2 border rounded-lg focus:ring-brand-blue focus:border-brand-blue dark:bg-slate-700 ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div className="space-y-4 pt-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200">{t('clientDetailsForm.pickupAddress')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="numero" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">N°</label>
                            <input type="text" name="numero" id="numero" value={formData.pickupAddress.numero} onChange={handleAddressChange} onBlur={validate} className={`w-full p-2 border rounded-lg dark:bg-slate-700 ${(errors as any).numero ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} />
                        </div>
                        <div>
                            <label htmlFor="avenue" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Avenue/Rue</label>
                            <input type="text" name="avenue" id="avenue" value={formData.pickupAddress.avenue} onChange={handleAddressChange} onBlur={validate} className={`w-full p-2 border rounded-lg dark:bg-slate-700 ${(errors as any).avenue ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} />
                        </div>
                        <div>
                            <label htmlFor="quartier" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Quartier</label>
                            <input type="text" name="quartier" id="quartier" value={formData.pickupAddress.quartier || ''} onChange={handleAddressChange} className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700" />
                        </div>
                        <div>
                            <label htmlFor="commune" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Commune</label>
                            <input type="text" name="commune" id="commune" value={formData.pickupAddress.commune} onChange={handleAddressChange} onBlur={validate} className={`w-full p-2 border rounded-lg dark:bg-slate-700 ${(errors as any).commune ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Référence/Point de repère</label>
                        <input type="text" name="reference" id="reference" value={formData.pickupAddress.reference || ''} onChange={handleAddressChange} className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700" />
                      </div>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-slate-600 dark:text-slate-200">
                        {t('profilePage.cancel')}
                    </button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90 disabled:bg-slate-400 disabled:cursor-wait">
                        {isSaving ? t('buttons.saving') : t('profilePage.saveChanges')}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};