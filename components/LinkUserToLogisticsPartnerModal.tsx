import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { User } from '../types';
import { Icon } from './Icon';

interface LinkUserToLogisticsPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const LinkUserToLogisticsPartnerModal: React.FC<LinkUserToLogisticsPartnerModalProps> = ({ isOpen, onClose, user }) => {
  const { logisticsPartners, getAllUsers, linkUserToLogisticsPartner, t } = useAppContext();
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  const unlinkedPartners = useMemo(() => {
    const allUsers = getAllUsers();
    const linkedPartnerIds = new Set(allUsers.map(u => u.logisticsPartnerId).filter(Boolean));
    return logisticsPartners.filter(p => !linkedPartnerIds.has(p.id));
  }, [logisticsPartners, getAllUsers]);

  const handleConfirm = () => {
    if (!selectedPartnerId) return;
    linkUserToLogisticsPartner(user.id, selectedPartnerId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <Icon name="xmark" className="w-6 h-6" />
        </button>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-brand-dark dark:text-slate-100 mb-2">{t('linkUserToLogisticsPartnerModal.title')}</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">{t('linkUserToLogisticsPartnerModal.description', { name: user.name })}</p>
          
          {unlinkedPartners.length > 0 ? (
            <div>
              <label htmlFor="partner-select" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('linkUserToLogisticsPartnerModal.availablePartners')}</label>
              <select
                id="partner-select"
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700"
              >
                <option value="">{t('linkUserToLogisticsPartnerModal.selectPartner')}</option>
                {unlinkedPartners.map(partner => (
                  <option key={partner.id} value={partner.id}>{partner.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-200">
              <p className="font-semibold">{t('linkUserToLogisticsPartnerModal.noUnlinkedPartners.title')}</p>
              <p className="text-sm">{t('linkUserToLogisticsPartnerModal.noUnlinkedPartners.description')}</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-4 pt-6 mt-4 border-t dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-slate-600 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500">
              {t('linkUserToLogisticsPartnerModal.cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedPartnerId}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {t('linkUserToLogisticsPartnerModal.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
