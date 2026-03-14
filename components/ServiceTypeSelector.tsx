import React from 'react';
import { useAppContext } from '../context/AppContext';
import { ServiceType } from '../types';

interface ServiceTypeSelectorProps {
  onNext: () => void;
}

export const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({ onNext }) => {
  const { updateOrderDraft, t } = useAppContext();

  const handleSelect = (serviceType: ServiceType) => {
    // FIX: Remove deprecated fields ('service', 'items', 'weight') and use `serviceItems`.
    updateOrderDraft({ serviceType, partner: null, serviceItems: [], totalPrice: 0 });
    onNext();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8 text-center">{t('serviceTypeSelector.title')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <button
          onClick={() => handleSelect(ServiceType.BLANCHISSERIE)}
          className="border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-left transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:border-brand-blue dark:hover:border-brand-blue overflow-hidden flex flex-col"
        >
          <img src="https://picsum.photos/seed/laundry_services/400/200" alt={t('serviceTypeSelector.laundryAlt')} className="w-full h-40 object-cover" />
          <div className="p-6 flex-grow">
            <h3 className="font-bold text-2xl">{t('serviceTypeSelector.laundry')}</h3>
            <p className="text-gray-600 dark:text-slate-300 mt-2">{t('serviceTypeSelector.laundryDesc')}</p>
          </div>
        </button>
        <button
          onClick={() => handleSelect(ServiceType.PRESSING)}
          className="border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-left transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:border-brand-blue dark:hover:border-brand-blue overflow-hidden flex flex-col"
        >
          <img src="https://picsum.photos/seed/dry_cleaning_services/400/200" alt={t('serviceTypeSelector.dryCleaningAlt')} className="w-full h-40 object-cover" />
          <div className="p-6 flex-grow">
            <h3 className="font-bold text-2xl">{t('serviceTypeSelector.dryCleaning')}</h3>
            <p className="text-gray-600 dark:text-slate-300 mt-2">{t('serviceTypeSelector.dryCleaningDesc')}</p>
          </div>
        </button>
        <button
          onClick={() => handleSelect(ServiceType.CORDONNERIE)}
          className="border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg text-left transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:border-brand-blue dark:hover:border-brand-blue overflow-hidden flex flex-col"
        >
          <img src="https://picsum.photos/seed/shoe_repair/400/200" alt={t('serviceTypeSelector.cordonnerie')} className="w-full h-40 object-cover" />
          <div className="p-6 flex-grow">
            <h3 className="font-bold text-2xl">{t('serviceTypeSelector.cordonnerie')}</h3>
            <p className="text-gray-600 dark:text-slate-300 mt-2">{t('serviceTypeSelector.cordonnerieDesc')}</p>
          </div>
        </button>
      </div>
    </div>
  );
};