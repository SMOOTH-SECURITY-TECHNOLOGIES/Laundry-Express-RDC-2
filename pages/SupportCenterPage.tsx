
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';

type ChatbotMessage = {
  id: number;
  author: 'user' | 'bot';
  text: string;
};

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-2 p-2">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
    </div>
);

export const SupportCenterPage: React.FC = () => {
    const { user, setCurrentPage, getChatbotResponse, t } = useAppContext();
    const [messages, setMessages] = useState<ChatbotMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setMessages([{
            id: Date.now(),
            author: 'bot',
            text: t('chatbot.welcomeMessage')
        }]);
    }, [t]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isBotTyping]);


    if (!user) {
        return (
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:border dark:border-slate-700 max-w-lg mx-auto my-12">
                <Icon name="shield-check" className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">{t('supportCenterPage.unauthorized')}</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">{t('supportCenterPage.loginToAccess')}</p>
                <button
                    onClick={() => setCurrentPage({ name: 'login' })}
                    className="px-8 py-3 bg-brand-blue text-white font-bold rounded-full hover:bg-opacity-90 shadow-lg transition-all"
                >
                    {t('supportCenterPage.login')}
                </button>
            </div>
        );
    }
    
    const handleSendMessage = async (messageText: string) => {
        if (!messageText.trim()) return;

        const userMessage: ChatbotMessage = { id: Date.now(), author: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsBotTyping(true);

        try {
            const botResponseText = await getChatbotResponse(messageText);
            const botMessage: ChatbotMessage = { id: Date.now() + 1, author: 'bot', text: botResponseText };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: ChatbotMessage = {
                id: Date.now() + 1,
                author: 'bot',
                text: t('supportCenterPage.botError')
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsBotTyping(false);
            inputRef.current?.focus();
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage(userInput);
    };

    const suggestedPrompts = [
        { key: 'suggestion1', label: t('chatbot.suggestion1') },
        { key: 'suggestion2', label: t('chatbot.suggestion2') },
        { key: 'suggestion3', label: t('chatbot.suggestion3') },
    ];

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-extrabold text-brand-dark dark:text-slate-100">{t('supportCenterPage.title')}</h1>
                <div className="hidden sm:flex items-center text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 px-3 py-1 rounded-full border dark:border-slate-700">
                    <Icon name="sparkles" className="w-3 h-3 mr-1 text-brand-blue" />
                    AI POWERED ASSISTANCE
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl dark:border dark:border-slate-700 flex flex-col flex-grow overflow-hidden">
                <div className="flex-grow p-4 sm:p-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 space-y-6 scrollbar-thin">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-3 ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                           {msg.author === 'bot' && (
                               <div className="w-10 h-10 rounded-full bg-brand-dark flex items-center justify-center shrink-0 shadow-sm border border-brand-blue/20">
                                   <Icon name="logo" className="w-6 h-6 text-white"/>
                               </div>
                           )}
                            <div className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl shadow-sm animate-fade-in ${
                                msg.author === 'user'
                                ? 'bg-brand-blue text-white rounded-br-none'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border dark:border-slate-700'
                            }`}>
                                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isBotTyping && (
                        <div className="flex items-end gap-3 justify-start animate-pulse">
                             <div className="w-10 h-10 rounded-full bg-brand-dark flex items-center justify-center shrink-0 border border-brand-blue/20">
                                 <Icon name="logo" className="w-6 h-6 text-white"/>
                             </div>
                            <div className="p-2 rounded-2xl bg-white dark:bg-slate-800 border dark:border-slate-700">
                                <TypingIndicator />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className="p-4 sm:p-6 border-t dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {suggestedPrompts.map(prompt => (
                             <button 
                                key={prompt.key} 
                                onClick={() => handleSendMessage(prompt.label)}
                                disabled={isBotTyping}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-all border dark:border-slate-600 disabled:opacity-50"
                            >
                                {prompt.label}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={handleSubmit} className="relative flex items-end gap-3">
                        <textarea
                            ref={inputRef} value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e as any);
                                }
                            }}
                            rows={1}
                            placeholder={t('chatbot.inputPlaceholder')}
                            className="flex-grow p-4 pr-14 border border-slate-300 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none max-h-32 bg-slate-50 dark:bg-slate-700 dark:text-slate-100 text-base"
                            disabled={isBotTyping}
                        />
                        <button 
                            type="submit" 
                            disabled={isBotTyping || !userInput.trim()} 
                            className="absolute right-3 bottom-3 p-3 bg-brand-blue text-white rounded-xl hover:bg-brand-dark disabled:bg-slate-300 dark:disabled:bg-slate-600 transition-all shadow-md"
                        >
                            <Icon name="paper-plane" className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
            
            <button
                onClick={() => setCurrentPage({ name: 'profile' })}
                className="mt-6 flex items-center justify-center text-slate-500 hover:text-brand-blue transition-colors text-sm font-semibold"
            >
                <Icon name="list" className="w-4 h-4 mr-2" />
                {t('supportCenterPage.createTicket')}
            </button>
        </div>
    );
};
