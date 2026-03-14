import React from 'react';
import { Icon } from './Icon';
import { useAppContext } from '../context/AppContext';

interface RegistrationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
}

export const RegistrationPromptModal: React.FC<RegistrationPromptModalProps> = ({ isOpen, onClose, onRegister }) => {
  const { t } = useAppContext();
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center relative animate-slide-up">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" aria-label={t('buttons.close', { default: 'Fermer' })}>
            <Icon name="xmark" className="w-6 h-6" />
        </button>

        <Icon name="star" className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        
        <h2 id="registration-modal-title" className="text-2xl font-bold text-brand-dark">{t('registrationPrompt.createAccountToContinue')}</h2>
        <p className="text-gray-600 mt-4 mb-6">
          {t('registrationPrompt.guestLimit')}
        </p>
        
        <ul className="text-left space-y-2 mb-8 list-none p-0">
            <li className="flex items-start">
                <Icon name="check" className="w-5 h-5 text-brand-success mr-3 mt-1 shrink-0" />
                <span>{t('registrationPrompt.benefit1')}</span>
            </li>
            <li className="flex items-start">
                <Icon name="check" className="w-5 h-5 text-brand-success mr-3 mt-1 shrink-0" />
                <span>{t('registrationPrompt.benefit2')}</span>
            </li>
             <li className="flex items-start">
                <Icon name="check" className="w-5 h-5 text-brand-success mr-3 mt-1 shrink-0" />
                <span>{t('registrationPrompt.benefit3')}</span>
            </li>
        </ul>

        <button
          onClick={onRegister}
          className="w-full px-6 py-3 bg-brand-blue text-white font-bold rounded-lg hover:bg-opacity-90 text-lg transition-transform transform hover:scale-105"
        >
          {t('registrationPrompt.createMyAccount')}
        </button>
         <button
          onClick={onClose}
          className="w-full mt-3 text-sm text-gray-600 hover:underline"
        >
          {t('registrationPrompt.cancel')}
        </button>
      </div>
    </div>
  );
};