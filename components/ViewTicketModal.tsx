import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from './Icon';
import { SupportTicket, TicketStatus, User, TicketCategory } from '../types';

interface ViewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: SupportTicket;
}

export const ViewTicketModal: React.FC<ViewTicketModalProps> = ({ isOpen, onClose, ticket }) => {
  const { user, addMessageToTicket, updateTicketStatus, t } = useAppContext();
  const [newMessage, setNewMessage] = useState('');
  const [status, setStatus] = useState(ticket.status);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStatus(ticket.status);
  }, [ticket.status]);

  useEffect(() => {
    // Scroll to the bottom of the messages list when it updates
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    addMessageToTicket(ticket.id, {
      authorId: user.id,
      // FIX: Use role check instead of `isAdmin`.
      authorName: (user.role === 'admin' || user.role === 'superadmin') ? t('viewTicketModal.adminAuthor', { default: 'Admin' }) : user.name,
      message: newMessage,
    });
    setNewMessage('');
  };
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TicketStatus;
    setStatus(newStatus);
    updateTicketStatus(ticket.id, newStatus);
  }

  const getStatusAppearance = (status: TicketStatus) => {
      switch (status) {
          case TicketStatus.OPEN: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
          case TicketStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
          case TicketStatus.CLOSED: return 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200';
          default: return 'bg-slate-100 text-slate-800';
      }
  };
  
  const getCategoryAppearance = (category?: TicketCategory) => {
        switch (category) {
            case TicketCategory.BILLING: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
            case TicketCategory.DAMAGED_ITEM: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
            case TicketCategory.DELIVERY_ISSUE: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
            case TicketCategory.SERVICE_QUALITY: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
            case TicketCategory.ACCOUNT_HELP: return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200';
        }
    };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full relative flex flex-col animate-slide-up h-[90vh]">
        <div className="p-6 border-b dark:border-slate-700">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <Icon name="xmark" className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-brand-dark dark:text-slate-100 pr-8">{ticket.subject}</h2>
            <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400 mt-2">
                <span>{t('viewTicketModal.by', { name: ticket.userName })}</span>
                {ticket.orderId && <span>{t('viewTicketModal.order', { id: ticket.orderId.split('-')[1]})}</span>}
            </div>

            <div className="mt-3 flex items-center space-x-2">
                 <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusAppearance(status)}`}>{t(`ticketStatus.${status}`)}</span>
                {ticket.category && (
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCategoryAppearance(ticket.category)}`}>
                        {t(`ticketCategory.${ticket.category}`)}
                    </span>
                )}
            </div>
            {ticket.aiSummary && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 text-sm text-blue-800 dark:text-blue-200 rounded-r-lg">
                    <p className="font-semibold">{t('viewTicketModal.aiSummaryTitle')}</p>
                    <p className="mt-1">{ticket.aiSummary}</p>
                </div>
            )}
        </div>

        <div className="flex-grow p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="space-y-4">
            {ticket.messages.map((msg) => {
              const isCurrentUser = msg.authorId === user?.id;
              const isAdminMsg = msg.authorName === t('viewTicketModal.adminAuthor', { default: 'Admin' });
              return (
                <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md p-3 rounded-lg ${isCurrentUser ? 'bg-brand-blue text-white' : 'bg-white dark:bg-slate-700 border dark:border-slate-600'}`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-2 ${isCurrentUser ? 'text-blue-200' : 'text-slate-400'}`}>
                        {isCurrentUser ? t('viewTicketModal.you') : msg.authorName} - {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <div className="p-6 border-t dark:border-slate-700">
            <form onSubmit={handleSendMessage}>
                <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100"
                    placeholder={t('viewTicketModal.typeResponse')}
                    required
                />
                 <div className="mt-2 flex justify-between items-center">
                    <div>
                        {/* FIX: Use role check instead of `isAdmin`. */}
                        {(user?.role === 'admin' || user?.role === 'superadmin') && (
                            <div className="flex items-center space-x-2">
                                <label htmlFor="status" className="text-sm font-medium">{t('viewTicketModal.changeStatus')}</label>
                                <select id="status" value={status} onChange={handleStatusChange} className="bg-slate-100 border-slate-300 rounded p-1 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100">
                                    {Object.values(TicketStatus).map(s => <option key={s} value={s}>{t(`ticketStatus.${s}`)}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90"
                    >
                        {t('viewTicketModal.send')}
                    </button>
                 </div>
            </form>
        </div>
      </div>
    </div>
  );
};
