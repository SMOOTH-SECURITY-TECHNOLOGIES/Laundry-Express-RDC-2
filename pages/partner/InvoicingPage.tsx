import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order, OrderStatus, Partner } from '../../types';
import { Icon } from '../../components/Icon';
import { formatAddress } from '../../types';

const InvoiceModal: React.FC<{
    order: Order;
    partner: Partner;
    type: 'proforma' | 'invoice';
    onClose: () => void;
}> = ({ order, partner, type, onClose }) => {
    const { t } = useAppContext();
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = printRef.current;
        if (printContent) {
            const printWindow = window.open('', '', 'height=600,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Print Invoice</title>');
                printWindow.document.write('<script src="https://cdn.tailwindcss.com"><\/script>');
                printWindow.document.write('</head><body >');
                printWindow.document.write(printContent.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
        }
    };

    const generatedDate = type === 'proforma' ? order.proformaGeneratedAt : order.invoiceGeneratedAt;

    const subtotal = useMemo(() => {
        return order.serviceItems.reduce((total, si) => {
            let serviceTotal = 0;
            if (si.service.priceModel === 'per_kg') {
                serviceTotal = (si.weight || 0) * (si.service.price || 0);
            } else if (si.service.priceModel === 'per_item') {
                serviceTotal = si.items?.reduce((itemTotal, item) => itemTotal + (item.article.price * item.quantity), 0) || 0;
            }
            return total + serviceTotal;
        }, 0);
    }, [order.serviceItems]);

    const totalDiscount = (order.discountAmount || 0) + (order.pointsDiscount || 0) + (order.referralDiscount || 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full relative flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">{type === 'proforma' ? t('invoiceModal.proformaTitle') : t('invoiceModal.invoiceTitle')}</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-slate-200 rounded-md hover:bg-slate-300">
                            <Icon name="arrow-down-tray" className="w-4 h-4" />
                            <span>{t('invoiceModal.print')}</span>
                        </button>
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                            <Icon name="xmark" className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="flex-grow p-6 overflow-y-auto" ref={printRef}>
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="font-bold text-lg mb-2">{partner.name}</h3>
                            <p className="text-sm text-slate-600">{formatAddress(partner.address)}</p>
                        </div>
                        <div className="text-right">
                             <h3 className="font-bold text-lg mb-2">{type === 'proforma' ? t('invoiceModal.proformaTitle') : t('invoiceModal.invoiceTitle')}</h3>
                            <p className="text-sm"><strong>{t('invoiceModal.orderId')}</strong> {order.id}</p>
                            {generatedDate && <p className="text-sm"><strong>{type === 'proforma' ? t('invoiceModal.proformaDate') : t('invoiceModal.invoiceDate')}</strong> {new Date(generatedDate).toLocaleDateString()}</p>}
                        </div>
                    </div>
                     <div className="p-4 border rounded-lg mb-8">
                        <h4 className="font-semibold text-slate-500">{t('invoiceModal.billTo')}</h4>
                        <p className="font-bold text-lg">{order.clientDetails?.name}</p>
                        <p className="text-sm text-slate-600">{order.clientDetails?.phone}</p>
                        <p className="text-sm text-slate-600">{formatAddress(order.clientDetails?.pickupAddress)}</p>
                    </div>

                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-2 text-left font-semibold">{t('invoiceModal.item')}</th>
                                <th className="p-2 text-center font-semibold">{t('invoiceModal.quantity')}</th>
                                <th className="p-2 text-right font-semibold">{t('invoiceModal.unitPrice')}</th>
                                <th className="p-2 text-right font-semibold">{t('invoiceModal.total')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.serviceItems.map(si => (
                                <React.Fragment key={si.service.id}>
                                    <tr><td colSpan={4} className="pt-3 font-semibold text-slate-600">{si.service.title}</td></tr>
                                    {si.service.priceModel === 'per_item' && si.items?.map(item => (
                                        <tr key={item.article.id} className="border-b">
                                            <td className="p-2">{item.article.name}</td>
                                            <td className="p-2 text-center">{item.quantity}</td>
                                            <td className="p-2 text-right">${item.article.price.toFixed(2)}</td>
                                            <td className="p-2 text-right">${(item.article.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                     {si.service.priceModel === 'per_kg' && si.weight && (
                                        <tr className="border-b">
                                            <td className="p-2">{si.service.title}</td>
                                            <td className="p-2 text-center">{si.weight.toFixed(2)} kg</td>
                                            <td className="p-2 text-right">${(si.service.price || 0).toFixed(2)}</td>
                                            <td className="p-2 text-right">${(si.weight * (si.service.price || 0)).toFixed(2)}</td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-8 flex justify-end">
                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between">
                                <span className="font-semibold">{t('invoiceModal.subtotal')}</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            {totalDiscount > 0 && (
                                <div className="flex justify-between">
                                    <span className="font-semibold">{t('invoiceModal.discount')}</span>
                                    <span>-${totalDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>{t('invoiceModal.grandTotal')}</span>
                                <span>${order.totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                     <p className="text-center text-slate-500 mt-8 text-sm">{t('invoiceModal.thankYou')}</p>
                </div>
            </div>
        </div>
    );
};


export const InvoicingPage: React.FC = () => {
    const { user, partners, orderHistory, apiGenerateProforma, apiGenerateInvoice, t } = useAppContext();
    const partner = useMemo(() => partners.find(p => p.id === user?.partnerId), [partners, user]);
    
    const [modalState, setModalState] = useState<{ order: Order; type: 'proforma' | 'invoice' } | null>(null);

    const completedOrders = useMemo(() => {
        if (!partner) return [];
        return orderHistory.filter(o => o.partner?.id === partner.id && o.status === OrderStatus.COMPLETED)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [partner, orderHistory]);

    const handleGenerate = async (orderId: string, type: 'proforma' | 'invoice') => {
        let updatedOrder: Order;
        if (type === 'proforma') {
            updatedOrder = await apiGenerateProforma(orderId);
        } else {
            updatedOrder = await apiGenerateInvoice(orderId);
        }
        setModalState({ order: updatedOrder, type });
    };

    const handleView = (order: Order, type: 'proforma' | 'invoice') => {
        setModalState({ order, type });
    };

    if (!partner) return null;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">{t('invoicingPage.title')}</h1>
                <p className="text-slate-500 mt-2 max-w-2xl">{t('invoicingPage.description')}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-card">
                <h2 className="text-2xl font-bold mb-4">{t('invoicingPage.completedOrders')}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th className="px-4 py-3">{t('invoicingPage.orderId')}</th>
                                <th className="px-4 py-3">{t('invoicingPage.customer')}</th>
                                <th className="px-4 py-3">{t('invoicingPage.date')}</th>
                                <th className="px-4 py-3 text-right">{t('invoicingPage.total')}</th>
                                <th className="px-4 py-3">{t('invoicingPage.status')}</th>
                                <th className="px-4 py-3">{t('invoicingPage.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {completedOrders.map(order => (
                                <tr key={order.id} className="border-b">
                                    <td className="px-4 py-3 font-mono">{order.id}</td>
                                    <td className="px-4 py-3">{order.clientDetails?.name}</td>
                                    <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-right font-semibold">${order.totalPrice.toFixed(2)}</td>
                                    <td className="px-4 py-3 space-y-1">
                                        <p className={`text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 rounded-full ${order.proformaGeneratedAt ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {t('invoicingPage.proformaGenerated')}
                                        </p>
                                        <p className={`text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 rounded-full ${order.invoiceGeneratedAt ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {t('invoicingPage.invoiceGenerated')}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center space-x-2">
                                            {order.proformaGeneratedAt ? 
                                                <button onClick={() => handleView(order, 'proforma')} className="text-xs px-2 py-1 bg-slate-200 rounded">{t('invoicingPage.viewProforma')}</button> :
                                                <button onClick={() => handleGenerate(order.id, 'proforma')} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{t('invoicingPage.generateProforma')}</button>
                                            }
                                            {order.invoiceGeneratedAt ? 
                                                <button onClick={() => handleView(order, 'invoice')} className="text-xs px-2 py-1 bg-slate-200 rounded">{t('invoicingPage.viewInvoice')}</button> :
                                                <button onClick={() => handleGenerate(order.id, 'invoice')} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{t('invoicingPage.generateInvoice')}</button>
                                            }
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {completedOrders.length === 0 && (
                        <p className="text-center text-slate-500 py-8">{t('invoicingPage.noCompletedOrders')}</p>
                    )}
                </div>
            </div>
            {modalState && partner && (
                <InvoiceModal 
                    order={modalState.order} 
                    partner={partner} 
                    type={modalState.type} 
                    onClose={() => setModalState(null)} 
                />
            )}
        </div>
    );
};