import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SupportTicket, TicketStatus, TicketCategory } from '../../types';
import { ViewTicketModal } from '../../components/ViewTicketModal';

export const SupportManagement: React.FC = () => {
    const { getAllTickets, t } = useAppContext();
    const [filter, setFilter] = useState<TicketStatus | 'all'>('all');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    const tickets = useMemo(() => {
        return getAllTickets().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [getAllTickets]);
    
    const filteredTickets = filter === 'all' 
        ? tickets 
        : tickets.filter(t => t.status === filter);

    const getStatusColor = (status: TicketStatus) => {
        switch(status) {
            case TicketStatus.OPEN: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
            case TicketStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
            case TicketStatus.CLOSED: return 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200';
            default: return 'bg-slate-100 text-slate-800';
        }
    }
    
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


    return (
        <>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">{t('adminSupport.title')}</h1>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">{t('adminSupport.allTickets', { count: filteredTickets.length })}</h2>
                        <div>
                            <label htmlFor="statusFilter" className="text-sm font-medium mr-2">{t('adminSupport.filterByStatus')}</label>
                            <select 
                                id="statusFilter"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as TicketStatus | 'all')}
                                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                            >
                                <option value="all">{t('adminSupport.all')}</option>
                                {Object.values(TicketStatus).map(status => (
                                    <option key={status} value={status}>{t(`ticketStatus.${status}`)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('adminSupport.subjectAiSummary')}</th>
                                    <th scope="col" className="px-6 py-3">{t('adminSupport.category')}</th>
                                    <th scope="col" className="px-6 py-3">{t('adminSupport.user')}</th>
                                    <th scope="col" className="px-6 py-3">{t('adminSupport.status')}</th>
                                    <th scope="col" className="px-6 py-3">{t('adminSupport.lastUpdate')}</th>
                                    <th scope="col" className="px-6 py-3">{t('adminSupport.action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTickets.map((ticket: SupportTicket) => (
                                    <tr key={ticket.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
                                            {ticket.subject}
                                            {ticket.aiSummary && <p className="font-normal text-xs text-slate-500 dark:text-slate-400 mt-1 italic">{ticket.aiSummary}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {ticket.category && (
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryAppearance(ticket.category)}`}>
                                                    {t(`ticketCategory.${ticket.category}`)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{ticket.userName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                                                {t(`ticketStatus.${ticket.status}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{new Date(ticket.updatedAt).toLocaleString('fr-FR')}</td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => setSelectedTicket(ticket)}
                                                className="px-3 py-1 text-xs font-medium text-white bg-brand-blue rounded-lg hover:bg-opacity-90"
                                            >
                                                {t('adminSupport.viewReply')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredTickets.length === 0 && (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-8">{t('adminSupport.noTicketsForFilter')}</p>
                    )}
                </div>
            </div>
            {selectedTicket && (
                <ViewTicketModal
                    isOpen={!!selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    ticket={selectedTicket}
                />
            )}
        </>
    );
};