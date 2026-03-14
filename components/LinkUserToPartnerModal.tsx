import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { User } from '../types';
import { Icon } from './Icon';

interface LinkUserToPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const LinkUserToPartnerModal: React.FC<LinkUserToPartnerModalProps> = ({ isOpen, onClose, user }) => {
  const { partners, getAllUsers, linkUserToPartner, t } = useAppContext();
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  const unlinkedPartners = useMemo(() => {
    const allUsers = getAllUsers();
    const linkedPartnerIds = new Set(allUsers.map(u => u.partnerId).filter(Boolean));
    return partners.filter(p => !linkedPartnerIds.has(p.id));
  }, [partners, getAllUsers]);

  const handleConfirm = () => {
    if (!selectedPartnerId) return;
    linkUserToPartner(user.id, selectedPartnerId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <Icon name="xmark" className="w-6 h-6" />
        </button>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-brand-dark mb-2">{t('linkUserModal.title')}</h2>
          <p className="text-slate-600 mb-6">{t('linkUserModal.description', { name: user.name })}</p>
          
          {unlinkedPartners.length > 0 ? (
            <div>
              <label htmlFor="partner-select" className="block text-sm font-medium text-gray-700 mb-1">{t('linkUserModal.availablePartners')}</label>
              <select
                id="partner-select"
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white"
              >
                <option value="">{t('linkUserModal.selectPartner')}</option>
                {unlinkedPartners.map(partner => (
                  <option key={partner.id} value={partner.id}>{partner.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
              <p className="font-semibold">{t('linkUserModal.noUnlinkedPartners.title')}</p>
              <p className="text-sm">{t('linkUserModal.noUnlinkedPartners.description')}</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-4 pt-6 mt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              {t('linkUserModal.cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedPartnerId}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {t('linkUserModal.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};