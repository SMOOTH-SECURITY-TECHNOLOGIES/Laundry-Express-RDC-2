import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from './Icon';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ isOpen, onClose }) => {
  const { user, orderHistory, createSupportTicket, t } = useAppContext();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');

  const userOrders = useMemo(() => {
    if (!user) return [];
    return orderHistory.filter(o => o.userId === user.id);
  }, [orderHistory, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError(t('createTicketModal.error'));
      return;
    }
    if (!user) {
        setError(t('createTicketModal.errorUser'));
        return;
    }
    setError('');
    createSupportTicket({
        userId: user.id,
        orderId,
        subject,
        message
    });
    // Reset form and close
    setSubject('');
    setMessage('');
    setOrderId(undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full relative animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <Icon name="xmark" className="w-6 h-6" />
        </button>
        <form onSubmit={handleSubmit} className="p-8">
          <h2 className="text-2xl font-bold text-center text-brand-dark mb-6">{t('createTicketModal.title')}</h2>
          
          {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg mb-4">{error}</p>}

          <div className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">{t('createTicketModal.subject')}</label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue"
                placeholder={t('createTicketModal.subjectPlaceholder')}
                required
              />
            </div>
            <div>
              <label htmlFor="orderId" className="block text-sm font-medium text-slate-700 mb-1">{t('createTicketModal.relatedOrder')}</label>
              <select
                id="orderId"
                value={orderId || ''}
                onChange={(e) => setOrderId(e.target.value || undefined)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white"
              >
                <option value="">{t('createTicketModal.noOrder')}</option>
                {userOrders.map(order => (
                  <option key={order.id} value={order.id}>
                    ID: {order.id.split('-')[1]} - {order.serviceItems.map(si => si.service.title).join(', ')} ({order.partner?.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">{t('createTicketModal.message')}</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue"
                placeholder={t('createTicketModal.messagePlaceholder')}
                required
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                {t('buttons.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90"
            >
              {t('createTicketModal.sendButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};