
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { Order, ChatMessage } from '../types.ts';
import { Icon } from './Icon.tsx';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, order }) => {
  const { user, addMessageToChat, getChatForOrder, t } = useAppContext();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const chat = order ? getChatForOrder(order.id) : null;
  const messages = chat?.messages || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !order || isSending) return;

    setIsSending(true);
    try {
      await addMessageToChat(order.id, {
        authorId: user.id,
        authorName: user.name,
        message: message.trim(),
      });
      setMessage('');
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-brand-dark text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-brand-blue flex items-center justify-center shadow-inner">
               <Icon name="chatBubble" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">{t('chatModal.title', { id: order.id.split('-')[1] })}</h3>
              <p className="text-xs text-brand-lightblue opacity-80">{order.partner?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Icon name="xmark" className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
               <Icon name="chatBubble" className="w-12 h-12 text-slate-300" />
               <p className="text-slate-500 dark:text-slate-400 text-sm">{t('chatModal.noMessages')}</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.authorId === user?.id;
              return (
                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                    isMe 
                    ? 'bg-brand-blue text-white rounded-br-none' 
                    : 'bg-white dark:bg-slate-700 dark:text-slate-100 rounded-bl-none border dark:border-slate-600'
                  }`}>
                    {!isMe && <p className="text-[10px] font-bold opacity-60 mb-1">{msg.authorName}</p>}
                    <p className="text-sm sm:text-base leading-relaxed">{msg.message}</p>
                    <p className={`text-[9px] mt-1 text-right opacity-60`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800">
          <form onSubmit={handleSend} className="flex items-end space-x-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('chatModal.typeMessage')}
              className="flex-grow p-3 bg-slate-100 dark:bg-slate-700 border-none rounded-xl focus:ring-2 focus:ring-brand-blue dark:text-white text-sm resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button 
              type="submit" 
              disabled={!message.trim() || isSending}
              className="p-3 bg-brand-blue text-white rounded-xl hover:bg-brand-dark disabled:bg-slate-300 dark:disabled:bg-slate-600 transition-all flex-shrink-0"
            >
              <Icon name="paper-plane" className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
