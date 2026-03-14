import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { MapLocationPickerModal } from './MapLocationPickerModal.tsx';
import { Icon } from './Icon.tsx';
import { DrcAddress } from '../types.ts';

const initialAddressState: DrcAddress = {
  commune: '',
  quartier: '',
  avenue: '',
  numero: '',
  reference: ''
};

export const ClientDetailsForm: React.FC = () => {
  const { user, orderDraft, updateOrderDraft, t } = useAppContext();
  const [name, setName] = useState(user?.name || orderDraft.clientDetails?.name || '');
  const [phone, setPhone] = useState(user?.phone || orderDraft.clientDetails?.phone || '');
  const [address, setAddress] = useState<DrcAddress>(
    (user?.pickupAddress as DrcAddress) || orderDraft.clientDetails?.pickupAddress || initialAddressState
  );
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
    updateOrderDraft({
      clientDetails: {
        name,
        phone,
        pickupAddress: address
      }
    });
  }, [name, phone, address, updateOrderDraft]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleLocationSelect = (selectedAddress: DrcAddress, coords: { lat: number, lng: number }) => {
      setAddress(selectedAddress);
      updateOrderDraft({
          clientDetails: {
              name,
              phone,
              pickupAddress: selectedAddress,
              coordinates: coords,
          }
      });
      setIsMapOpen(false);
  };

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">{t('clientDetailsForm.yourInfo')}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('clientDetailsForm.fullName')}</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue dark:bg-slate-700 dark:text-slate-100"
                placeholder={t('clientDetailsForm.fullNamePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('clientDetailsForm.phoneNumber')}</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue dark:bg-slate-700 dark:text-slate-100"
                placeholder={t('clientDetailsForm.phonePlaceholder')}
              />
            </div>
          </div>
          <div className="pt-4 border-t dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200">{t('clientDetailsForm.pickupAddress')}</h3>
            <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="mt-2 mb-4 w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-brand-blue bg-blue-100 dark:bg-blue-900/40 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60"
            >
                <Icon name="mapPin" className="w-5 h-5" />
                <span>{t('clientDetailsForm.selectOnMap')}</span>
            </button>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="numero" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">N°</label>
                <input type="text" name="numero" value={address.numero} onChange={handleAddressChange} className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700" />
              </div>
              <div>
                <label htmlFor="avenue" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Avenue/Rue</label>
                <input type="text" name="avenue" value={address.avenue} onChange={handleAddressChange} className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700" />
              </div>
              <div>
                <label htmlFor="quartier" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Quartier</label>
                <input type="text" name="quartier" value={address.quartier || ''} onChange={handleAddressChange} className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700" />
              </div>
               <div>
                <label htmlFor="commune" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Commune</label>
                <input type="text" name="commune" value={address.commune} onChange={handleAddressChange} className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700" />
              </div>
            </div>
            <div className="mt-4">
               <label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Référence/Point de repère</label>
                <input type="text" name="reference" value={address.reference || ''} onChange={handleAddressChange} className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700" />
            </div>
          </div>
        </div>
      </div>
      <MapLocationPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onLocationSelect={handleLocationSelect}
      />
    </>
  );
};
