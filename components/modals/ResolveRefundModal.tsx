import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../Icon';

interface ResolveRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'approve' | 'reject';
  onConfirm: (notes: string) => void;
}

export const ResolveRefundModal: React.FC<ResolveRefundModalProps> = ({ isOpen, onClose, action, onConfirm }) => {
  const { t } = useAppContext();
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsLoading(true);
    await onConfirm(notes);
    // The parent component will handle closing the modal on success
  };

  const isApprove = action === 'approve';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full relative animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <Icon name="xmark" className="w-6 h-6" />
        </button>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center text-brand-dark dark:text-slate-100 mb-6">
            {isApprove ? t('resolveRefundModal.approveTitle') : t('resolveRefundModal.rejectTitle')}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="resolutionNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('resolveRefundModal.notesLabel')}</label>
              <textarea
                id="resolutionNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue"
                placeholder={t('resolveRefundModal.notesPlaceholder')}
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-slate-600 dark:text-slate-100 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500">
                {t('buttons.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`px-6 py-2 text-white font-bold rounded-lg hover:bg-opacity-90 disabled:bg-slate-400 ${isApprove ? 'bg-brand-success' : 'bg-red-600'}`}
            >
              {isLoading ? t('buttons.loading') : (isApprove ? t('resolveRefundModal.approveButton') : t('resolveRefundModal.rejectButton'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};