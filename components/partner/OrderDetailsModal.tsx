import React from 'react';
import { Order } from '../../types';
import { Icon } from '../Icon';
import { useAppContext } from '../../context/AppContext';
import { formatAddress } from '../../types';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onConfirm: (order: Order) => void;
  onReject: (orderId: string) => void;
  onOpenChat: (order: Order) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, onConfirm, onReject, onOpenChat }) => {
  const { t } = useAppContext();

  if (!isOpen || !order) return null;

  const subtotal = order.serviceItems.reduce((total, si) => {
    let serviceTotal = 0;
    if (si.service.priceModel === 'per_kg') {
        serviceTotal = (si.weight || 0) * (si.service.price || 0);
    } else if (si.service.priceModel === 'per_item') {
        serviceTotal = si.items?.reduce((itemTotal, item) => itemTotal + (item.article.price * item.quantity), 0) || 0;
    }
    return total + serviceTotal;
  }, 0);

  const totalDiscount = (order.discountAmount || 0) + (order.pointsDiscount || 0) + (order.referralDiscount || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-brand-dark dark:text-slate-100" id="order-details-title">{t('orderDetailsModal.title')}</h2>
            <p className="text-sm font-mono text-slate-500 dark:text-slate-400">{t('orderDetailsModal.orderId', { id: order.id })}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <Icon name="xmark" className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow p-6 overflow-y-auto space-y-6">
          {/* Customer Info */}
          <section>
            <h3 className="font-bold text-lg mb-2">{t('orderDetailsModal.customerInfo')}</h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-2 text-sm">
              <p><strong>{t('orderDetailsModal.name')}:</strong> {order.clientDetails?.name}</p>
              <p><strong>{t('orderDetailsModal.phone')}:</strong> {order.clientDetails?.phone}</p>
              <p><strong>{t('orderDetailsModal.address')}:</strong> {formatAddress(order.clientDetails?.pickupAddress)}</p>
            </div>
          </section>

          {/* Pickup Schedule */}
          <section>
            <h3 className="font-bold text-lg mb-2">{t('orderDetailsModal.pickupSchedule')}</h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="font-semibold">{order.pickupTime}</p>
            </div>
          </section>
          
          {/* Order Details */}
          <section>
            <h3 className="font-bold text-lg mb-2">{t('orderDetailsModal.orderDetails')}</h3>
            <div className="border rounded-lg overflow-hidden dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="p-2 text-left font-semibold">{t('orderDetailsModal.itemHeader')}</th>
                    <th className="p-2 text-center font-semibold">{t('orderDetailsModal.quantityHeader')}</th>
                    <th className="p-2 text-right font-semibold">{t('orderDetailsModal.priceHeader')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.serviceItems.map(si => (
                    <React.Fragment key={si.service.id}>
                      <tr className="border-t dark:border-slate-700"><td colSpan={3} className="pt-2 pl-2 font-semibold text-slate-600 dark:text-slate-300">{si.service.title}</td></tr>
                      {si.service.priceModel === 'per_item' && si.items?.map(item => (
                        <tr key={item.article.id}>
                          <td className="p-2 pl-4">{item.article.name}</td>
                          <td className="p-2 text-center">{item.quantity}</td>
                          <td className="p-2 text-right">${(item.article.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                      {si.service.priceModel === 'per_kg' && si.weight && (
                        <tr>
                          <td className="p-2 pl-4">{t('orderDetailsModal.estimatedWeight')}</td>
                          <td className="p-2 text-center">{si.weight.toFixed(2)} kg @ ${si.service.price?.toFixed(2)}/kg</td>
                          <td className="p-2 text-right">${(si.weight * (si.service.price || 0)).toFixed(2)}</td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pricing Summary */}
          <div className="pt-4 border-t dark:border-slate-600 space-y-2 text-sm">
            <div className="flex justify-between"><span>{t('emails.orderStatusUpdate.subtotal')}</span><span>${subtotal.toFixed(2)}</span></div>
            {totalDiscount > 0 && <div className="flex justify-between text-green-600"><span>{t('invoiceModal.discount')}</span><span>-${totalDiscount.toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-lg"><span>{t('orderDetailsModal.estimatedTotal')}</span><span>${order.totalPrice.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="p-4 border-t dark:border-slate-700 flex justify-between items-center shrink-0">
          <button onClick={() => onOpenChat(order)} className="px-4 py-2 text-sm font-semibold bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center space-x-2 hover:bg-slate-300 dark:hover:bg-slate-600">
            <Icon name="chatBubble" className="w-5 h-5"/>
            <span>{t('orderDetailsModal.openChat')}</span>
          </button>
          <div className="flex space-x-2">
            <button onClick={() => onReject(order.id)} className="px-4 py-2 text-sm font-semibold text-red-700 bg-red-100 dark:bg-red-900/40 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60">{t('notifications.actions.reject')}</button>
            <button onClick={() => onConfirm(order)} className="px-4 py-2 text-sm font-semibold text-white bg-brand-success rounded-lg hover:bg-opacity-90">{t('notifications.actions.accept')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};