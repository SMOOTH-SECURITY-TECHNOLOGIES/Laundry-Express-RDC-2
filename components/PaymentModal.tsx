import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from './Icon';
import { trackEvent } from '../utils/tracking';
import { User } from '../types';
import { pilotConfig } from '../config/pilot';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (selectedMethod: string, onComplete: () => void) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onConfirmPayment }) => {
  const { orderDraft, user, t } = useAppContext();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      setTimeout(() => (firstElement as HTMLElement)?.focus(), 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (!isProcessing) onClose();
          return;
        }

        if (e.key !== 'Tab' || !focusableElements.length) return;

        if (e.shiftKey) { 
          if (document.activeElement === firstElement) {
            (lastElement as HTMLElement)?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            (firstElement as HTMLElement)?.focus();
            e.preventDefault();
          }
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (!isProcessing) {
            previouslyFocusedElement.current?.focus();
        }
      };
    }
  }, [isOpen, onClose, isProcessing]);


  const getItemsForTracking = () => {
    return orderDraft.serviceItems?.flatMap(si => {
        if (si.service.priceModel === 'per_kg') {
            return [{
                item_id: si.service.id,
                item_name: si.service.title,
                price: si.service.price,
                quantity: si.weight || 0,
                item_category: si.service.type
            }];
        }
        return si.items?.map(item => ({
            item_id: item.article.id,
            item_name: item.article.name,
            item_category: si.service.title,
            price: item.article.price,
            quantity: item.quantity
        })) || [];
    }) || [];
  };

  const handlePayment = () => {
    if (!selectedMethod) {
      setError(t('paymentModal.selectMethodError'));
      return;
    }
    setError('');

    // --- AddPaymentInfo event ---
    const subtotal = orderDraft.totalPrice || 0;
    const finalTotal = Math.max(0, subtotal - (orderDraft.discountAmount || 0) - (orderDraft.pointsDiscount || 0) - (orderDraft.referralDiscount || 0));
    
    let userDataPayload = {};
    const details = user || orderDraft.clientDetails;
    const address = user ? user.pickupAddress : orderDraft.clientDetails?.pickupAddress;

    if (details && address) {
        const [firstName, ...lastNameParts] = (details.name || '').split(' ');
        const lastName = lastNameParts.join(' ');
        userDataPayload = {
            user_data: {
                email: (details as User).email,
                phone_number: details.phone,
                address: {
                    first_name: firstName,
                    last_name: lastName,
                    street: `${address.numero || ''} ${address.avenue || ''}, ${address.quartier || ''}`.trim(),
                    city: address.commune,
                    country: 'CD'
                }
            }
        };
    }

    trackEvent('AddPaymentInfo', {
        currency: 'USD',
        value: finalTotal,
        payment_type: selectedMethod, // useful data for analytics
        items: getItemsForTracking(),
        ...userDataPayload
    });
    // --- End event ---

    setIsProcessing(true);
    onConfirmPayment(selectedMethod, () => {
        setIsProcessing(false);
        onClose();
    });
  };

  if (!isOpen) return null;
  
  const subtotal = orderDraft.totalPrice || 0;
  const promoD = orderDraft.discountAmount || 0;
  const pointsD = orderDraft.pointsDiscount || 0;
  const referralD = orderDraft.referralDiscount || 0;
  const finalTotal = Math.max(0, subtotal - promoD - pointsD - referralD);

  const paymentOptions = [
    { id: 'cash', name: 'Cash a la livraison' },
    { id: 'mpesa', name: 'M-Pesa' },
    { id: 'airtel', name: 'Airtel Money' },
    { id: 'orange', name: 'Orange Money' },
    { id: 'card', name: 'Credit Card' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div ref={modalRef} className="bg-white rounded-2xl shadow-xl max-w-md w-full relative animate-slide-up">
         {!isProcessing && (
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10" aria-label={t('buttons.close', { default: "Fermer" })}>
                <Icon name="xmark" className="w-6 h-6" />
            </button>
         )}
        <div className="p-8 text-center">
            {pilotConfig.paymentMode !== 'live' && (
              <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                {pilotConfig.paymentModeLabel}
              </div>
            )}
            <h2 id="payment-modal-title" className="text-2xl font-bold text-brand-dark mb-2">{t('paymentModal.title')}</h2>
            <p className="text-slate-600 mb-6">{t('paymentModal.totalToPay')}</p>
            <p className="text-5xl font-extrabold text-brand-blue mb-8">{finalTotal.toFixed(2)} $</p>
            
            <p className="text-sm font-semibold text-slate-700 mb-4">{t('paymentModal.payWith')}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                {paymentOptions.map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setSelectedMethod(opt.id)}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center space-y-2 transition-all ${selectedMethod === opt.id ? 'border-brand-blue bg-blue-50' : 'border-slate-200 hover:border-slate-400'}`}
                    >
                        <span className="font-semibold">{opt.name}</span>
                    </button>
                ))}
            </div>
            
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full px-6 py-4 bg-brand-success text-white font-bold rounded-lg text-lg flex items-center justify-center space-x-3 hover:bg-opacity-90 disabled:bg-slate-400 disabled:cursor-wait"
            >
                {isProcessing ? (
                    <>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{t('paymentModal.processingPayment')}</span>
                    </>
                ) : (
                    <span>{t('paymentModal.payNow', { amount: finalTotal.toFixed(2) })}</span>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
