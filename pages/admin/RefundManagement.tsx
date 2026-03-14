import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { RefundRequest, RefundStatus } from '../../types';
import { Icon } from '../../components/Icon';
import { ResolveRefundModal } from '../../components/modals/ResolveRefundModal';

const RefundRequestCard: React.FC<{
  request: RefundRequest;
  onApprove: (request: RefundRequest) => void;
  onReject: (request: RefundRequest) => void;
}> = ({ request, onApprove, onReject }) => {
  const { t } = useAppContext();

  const getStatusColor = (status: RefundStatus) => {
    switch(status) {
        case RefundStatus.APPROVED: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-500';
        case RefundStatus.REJECTED: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-500';
        case RefundStatus.PENDING:
        default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-500';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${getStatusColor(request.status)}`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">{t('refundRequestModal.forOrder', { id: request.orderId })}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t('refundManagement.requestedBy', { name: request.userName })} - <span className="font-semibold">{t(`refundReasons.${request.reason}`)}</span>
                </p>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg text-slate-800 dark:text-slate-100">${request.requestedAmount.toFixed(2)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(request.createdAt).toLocaleString()}</p>
            </div>
        </div>
        <p className="text-sm italic text-slate-700 dark:text-slate-200 mt-2 bg-slate-100 dark:bg-slate-800/50 p-2 rounded">"{request.customerComments}"</p>
        {request.status !== RefundStatus.PENDING && request.resolutionNotes && (
            <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800/50 rounded text-xs">
                <p className="font-semibold">{t('refundManagement.resolutionNotes')}:</p>
                <p className="italic">{request.resolutionNotes}</p>
            </div>
        )}
        {request.status === RefundStatus.PENDING && (
            <div className="flex justify-end space-x-2 mt-4">
                <button onClick={() => onReject(request)} className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-md hover:bg-red-200">
                    {t('refundManagement.reject')}
                </button>
                <button onClick={() => onApprove(request)} className="px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-700 rounded-md hover:bg-green-200">
                    {t('refundManagement.approve')}
                </button>
            </div>
        )}
    </div>
  );
};

export const RefundManagement: React.FC = () => {
    const { refundRequests, approveRefundRequest, rejectRefundRequest, t } = useAppContext();
    const [filter, setFilter] = useState<RefundStatus | 'all'>(RefundStatus.PENDING);
    const [modalState, setModalState] = useState<{ action: 'approve' | 'reject', request: RefundRequest } | null>(null);

    const filteredRequests = useMemo(() => {
        const sorted = [...refundRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (filter === 'all') return sorted;
        return sorted.filter(r => r.status === filter);
    }, [refundRequests, filter]);

    const handleConfirmResolution = async (notes: string) => {
        if (!modalState) return;
        if (modalState.action === 'approve') {
            await approveRefundRequest(modalState.request.id, notes);
        } else {
            await rejectRefundRequest(modalState.request.id, notes);
        }
        setModalState(null);
    };

    return (
        <>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">{t('refundManagement.title', { default: 'Refund Requests' })}</h1>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">{t('refundManagement.requests', { count: filteredRequests.length })}</h2>
                        <div>
                            <label htmlFor="statusFilter" className="text-sm font-medium mr-2">{t('refundManagement.filterByStatus')}</label>
                            <select 
                                id="statusFilter"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as RefundStatus | 'all')}
                                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                            >
                                <option value="all">{t('refundManagement.all')}</option>
                                {Object.values(RefundStatus).map(status => (
                                    <option key={status} value={status}>{t(`refundStatus.${status}`)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredRequests.length > 0 ? (
                            filteredRequests.map(req => (
                                <RefundRequestCard 
                                    key={req.id} 
                                    request={req}
                                    onApprove={(r) => setModalState({ action: 'approve', request: r })}
                                    onReject={(r) => setModalState({ action: 'reject', request: r })}
                                />
                            ))
                        ) : (
                            <p className="text-center text-slate-500 py-8">{t('refundManagement.noRequests')}</p>
                        )}
                    </div>
                </div>
            </div>
            {modalState && (
                <ResolveRefundModal 
                    isOpen={!!modalState}
                    onClose={() => setModalState(null)}
                    action={modalState.action}
                    onConfirm={handleConfirmResolution}
                />
            )}
        </>
    );
};
