import React, { useState } from 'react';
import { PartnerFeatures } from '../types';
import { Icon } from './Icon';
import { useAppContext } from '../context/AppContext';

interface BulkFeatureEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (featureKey: keyof PartnerFeatures, updates: { partnerId: string, value: boolean }[]) => void;
  featureKey: keyof PartnerFeatures | null;
  featureName: string | null;
}

const BulkFeatureEditModal: React.FC<BulkFeatureEditModalProps> = ({ isOpen, onClose, onSave, featureKey, featureName }) => {
  const { t, partners } = useAppContext();
  const [partnerStates, setPartnerStates] = useState<{ [partnerId: string]: boolean }>({});
  const [initialStates, setInitialStates] = useState<{ [partnerId: string]: boolean }>({});
  const [prevFeatureKey, setPrevFeatureKey] = useState(featureKey);

  if (featureKey !== prevFeatureKey) {
    setPrevFeatureKey(featureKey);
    if (featureKey) {
      const initial: { [partnerId: string]: boolean } = {};
      partners.forEach(p => {
        initial[p.id] = p.enabledFeatures?.[featureKey] || false;
      });
      setPartnerStates(initial);
      setInitialStates(initial);
    }
  }

  if (!isOpen || !featureKey || !featureName) return null;

  const handleToggle = (partnerId: string) => {
    setPartnerStates(prev => ({ ...prev, [partnerId]: !prev[partnerId] }));
  };

  const handleSelectAll = () => {
    const allEnabled: { [partnerId: string]: boolean } = {};
    partners.forEach(p => { allEnabled[p.id] = true; });
    setPartnerStates(allEnabled);
  };

  const handleDeselectAll = () => {
    const allDisabled: { [partnerId: string]: boolean } = {};
    partners.forEach(p => { allDisabled[p.id] = false; });
    setPartnerStates(allDisabled);
  };
  
  const handleSave = () => {
      const updates: { partnerId: string, value: boolean }[] = [];
      for (const partnerId in partnerStates) {
          if (partnerStates[partnerId] !== initialStates[partnerId]) {
              updates.push({ partnerId, value: partnerStates[partnerId] });
          }
      }
      onSave(featureKey, updates);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-300 dark:hover:text-slate-100 z-10">
            <Icon name="xmark" className="w-6 h-6" />
        </button>
        <div className="p-6 border-b dark:border-slate-700">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-slate-100">{t('bulkFeatureEditModal.title', { featureName })}</h2>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
            <div className="flex justify-end space-x-2 mb-4">
                 <button onClick={handleSelectAll} className="px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-700 rounded-md hover:bg-green-200">{t('bulkFeatureEditModal.selectAll')}</button>
                 <button onClick={handleDeselectAll} className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-md hover:bg-red-200">{t('bulkFeatureEditModal.deselectAll')}</button>
            </div>
            <div className="space-y-2">
                {partners.map(p => (
                     <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="font-medium text-slate-800 dark:text-slate-100">{p.name}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={partnerStates[p.id] || false} onChange={() => handleToggle(p.id)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                        </label>
                    </div>
                ))}
            </div>
        </div>
        <div className="p-6 border-t dark:border-slate-700 flex justify-end">
            <button onClick={handleSave} className="px-6 py-2 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90">
                {t('bulkFeatureEditModal.saveButton')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default BulkFeatureEditModal;
