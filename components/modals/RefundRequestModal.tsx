import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order, RefundReason } from '../../types';
import { Icon } from '../Icon';

interface RefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const RefundRequestModal: React.FC<RefundRequestModalProps> = ({ isOpen, onClose, order }) => {
  const { submitRefundRequest, addNotification, user, t } = useAppContext();
  const [reason, setReason] = useState<RefundReason>(RefundReason.POOR_QUALITY);
  const [comments, setComments] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) {
        setError(t('refundRequestModal.commentsRequired'));
        return;
    }
    if (!user) {
        setError('User not found.');
        return;
    }
    setError('');
    setIsLoading(true);
    try {
        await submitRefundRequest({
            orderId: order.id,
            userId: user.id,
            reason,
            customerComments: comments
        });
        addNotification(t('notifications.refundRequestSubmitted'), 'success');
        onClose();
    } catch (e) {
        addNotification(t('notifications.refundRequestError'), 'error');
    } finally {
        setIsLoading(false);
    }
  };
  
  // FIX: Use enum values directly to create the array and satisfy the RefundReason[] type.
  const reasons: RefundReason[] = [RefundReason.ITEM_DAMAGED, RefundReason.ITEM_MISSING, RefundReason.POOR_QUALITY, RefundReason.LATE_DELIVERY, RefundReason.OTHER];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full relative animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <Icon name="xmark" className="w-6 h-6" />
        </button>
        <form onSubmit={handleSubmit} className="p-8">
          <h2 className="text-2xl font-bold text-center text-brand-dark dark:text-slate-100 mb-2">{t('refundRequestModal.title')}</h2>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
            {t('refundRequestModal.forOrder', { id: order.id.split('-')[1] })}
          </p>

          {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg mb-4">{error}</p>}

          <div className="space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('refundRequestModal.reasonLabel')}</label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as RefundReason)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100"
              >
                {reasons.map(r => (
                    <option key={r} value={r}>{t(`refundReasons.${r}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('refundRequestModal.commentsLabel')}</label>
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue"
                placeholder={t('refundRequestModal.commentsPlaceholder')}
                required
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('refundRequestModal.note')}</p>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-slate-600 dark:text-slate-100 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500">
                {t('buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-brand-blue text-white font-bold rounded-lg hover:bg-opacity-90 disabled:bg-slate-400"
            >
              {isLoading ? t('buttons.loading') : t('refundRequestModal.submitButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
