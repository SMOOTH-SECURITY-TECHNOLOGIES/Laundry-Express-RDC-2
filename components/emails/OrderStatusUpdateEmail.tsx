import React, { CSSProperties } from 'react';
import { Order, OrderStatus } from '../../types';

interface OrderStatusUpdateEmailProps {
  userName: string;
  order: Order;
  statusText: string;
  headline: string;
  t?: (key: string, options?: any) => string;
}

const styles: { [key: string]: CSSProperties } = {
    body: { fontFamily: 'sans-serif', color: '#333' },
    container: { padding: '20px', maxWidth: '600px', margin: 'auto', border: '1px solid #ddd', borderRadius: '8px' },
    header: { fontSize: '24px', fontWeight: 'bold', color: '#03045E' },
    statusBox: { backgroundColor: '#f0f8ff', borderLeft: '4px solid #0066CC', padding: '15px', margin: '20px 0' },
    button: { backgroundColor: '#0066CC', color: 'white', padding: '12px 20px', textDecoration: 'none', borderRadius: '5px', display: 'inline-block' },
    orderDetails: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee', backgroundColor: '#f7f9fc' },
    td: { textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' },
    totalRowTd: { fontWeight: 'bold', borderTop: '2px solid #ccc', textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }
};

export const OrderStatusUpdateEmail: React.FC<OrderStatusUpdateEmailProps> = ({ userName, order, statusText, headline, t }) => {
  if (!t) return null;

  const subtotal = order.totalPrice + (order.discountAmount || 0) + (order.pointsDiscount || 0) + (order.referralDiscount || 0);
  
  return (
    <html lang={t('language')}>
      <head>
        <title>{headline}</title>
      </head>
      <body style={styles.body}>
        <div style={styles.container}>
          <p style={styles.header}>{headline}</p>
          <p>{t('emails.orderStatusUpdate.greeting', { name: userName })}</p>

          <div style={styles.statusBox}>
            <p><strong>{t('emails.orderStatusUpdate.orderId')}:</strong> #{order.id.split('-')[1]}</p>
            <p><strong>{t('emails.orderStatusUpdate.newStatus')}:</strong> {statusText}</p>
            {order.status === OrderStatus.CONFIRMED && order.estimatedCompletionTime && (
              <p><strong>{t('emails.orderStatusUpdate.estimatedCompletion')}:</strong> {order.estimatedCompletionTime}</p>
            )}
          </div>

          <h2>{t('emails.orderStatusUpdate.summaryTitle')}</h2>
          <table style={styles.orderDetails}>
            <thead>
              <tr>
                <th style={styles.th}>{t('emails.orderStatusUpdate.itemHeader')}</th>
                <th style={{...styles.th, textAlign: 'center'}}>{t('emails.orderStatusUpdate.quantityHeader')}</th>
                <th style={{...styles.th, textAlign: 'right'}}>{t('emails.orderStatusUpdate.priceHeader')}</th>
              </tr>
            </thead>
            <tbody>
              {order.serviceItems.map(si => (
                <React.Fragment key={si.service.id}>
                  <tr><td colSpan={3} style={{...styles.td, paddingTop: '15px'}}><strong>{si.service.title}</strong></td></tr>
                  {si.service.priceModel === 'per_item' && si.items?.map(item => (
                    <tr key={item.article.id}>
                      <td style={{...styles.td, paddingLeft: '20px'}}>{item.article.name}</td>
                      <td style={{...styles.td, textAlign: 'center'}}>{item.quantity}</td>
                      <td style={{...styles.td, textAlign: 'right'}}>${(item.article.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                  {si.service.priceModel === 'per_kg' && si.weight && (
                    <tr>
                      <td style={{...styles.td, paddingLeft: '20px'}}>{si.service.description}</td>
                      <td style={{...styles.td, textAlign: 'center'}}>{si.weight.toFixed(2)} kg</td>
                      <td style={{...styles.td, textAlign: 'right'}}>${(si.weight * (si.service.price || 0)).toFixed(2)}</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {/* Pricing breakdown */}
              <tr>
                <td colSpan={2} style={{...styles.td, textAlign: 'right'}}>{t('emails.orderStatusUpdate.subtotal')}</td>
                <td style={{...styles.td, textAlign: 'right'}}>${subtotal.toFixed(2)}</td>
              </tr>
              {order.discountAmount && order.discountAmount > 0 && (
                 <tr>
                  <td colSpan={2} style={{...styles.td, textAlign: 'right'}}>{t('emails.orderStatusUpdate.promoDiscount', { code: order.appliedPromoCode })}</td>
                  <td style={{...styles.td, textAlign: 'right'}}>-${order.discountAmount.toFixed(2)}</td>
                </tr>
              )}
               {order.referralDiscount && order.referralDiscount > 0 && (
                 <tr>
                  <td colSpan={2} style={{...styles.td, textAlign: 'right'}}>{t('emails.orderStatusUpdate.referralDiscount')}</td>
                  <td style={{...styles.td, textAlign: 'right'}}>-${order.referralDiscount.toFixed(2)}</td>
                </tr>
              )}
              {order.pointsDiscount && order.pointsDiscount > 0 && (
                 <tr>
                  <td colSpan={2} style={{...styles.td, textAlign: 'right'}}>{t('emails.orderStatusUpdate.loyaltyDiscount')}</td>
                  <td style={{...styles.td, textAlign: 'right'}}>-${order.pointsDiscount.toFixed(2)}</td>
                </tr>
              )}
              <tr>
                <td colSpan={2} style={{...styles.totalRowTd, textAlign: 'right'}}>{t('emails.orderStatusUpdate.totalPaid')}</td>
                <td style={{...styles.totalRowTd, textAlign: 'right'}}>${order.totalPrice.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <p style={{marginTop: '20px'}}>{t('emails.orderStatusUpdate.body')}</p>
          <a href="#" style={styles.button}>{t('emails.orderStatusUpdate.cta')}</a>
          <p>{t('emails.orderStatusUpdate.footer')}</p>
        </div>
      </body>
    </html>
  );
};
