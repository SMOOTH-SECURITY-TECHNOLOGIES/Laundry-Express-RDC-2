import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { PressingSelector } from '../components/PressingSelector';
import { SchedulePicker } from '../components/SchedulePicker';
import { OrderStatus, CreateOrderRequest, User } from '../types';
import { ClientDetailsForm } from '../components/ClientDetailsForm';
import { RegistrationPromptModal } from '../components/RegistrationPromptModal';
import { PaymentModal } from '../components/PaymentModal';
import { MultiServiceOrder } from '../components/MultiServiceOrder';
import { OrderSummary } from '../components/OrderSummary';
import { ServiceTypeSelector } from '../components/ServiceTypeSelector';
import { trackEvent } from '../utils/tracking';
import { sendServerSideEvent } from '../utils/capi';

export const OrderPage: React.FC = () => {
  const { 
    orderDraft, setActiveOrder, setCurrentPage, 
    resetOrderDraft, addOrderToHistory, user, 
    guestOrderCount, addNotification, updateOrderDraft, t 
  } = useAppContext();
  
  const getInitialStep = () => {
    if (!orderDraft.serviceType) return 0;
    if (!orderDraft.partner) return 1;
    return 2;
  };

  const [step, setStep] = useState(getInitialStep);
  const [isPromptingRegistration, setIsPromptingRegistration] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  useEffect(() => {
    setStep(getInitialStep());
  }, [orderDraft.serviceType, orderDraft.partner]);

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

  const handleOpenPayment = () => {
    const isItemsValid = orderDraft.serviceItems && orderDraft.serviceItems.length > 0 && 
        orderDraft.serviceItems.some(si => (si.items && si.items.length > 0) || (si.weight && si.weight > 0));

    if (!orderDraft.partner || !orderDraft.pickupTime || !isItemsValid || !orderDraft.clientDetails) {
      alert(t('orderPage.completeAllSteps'));
      return;
    }

    if (!user && guestOrderCount >= 5) {
      setIsPromptingRegistration(true);
      return;
    }

    const subtotal = orderDraft.totalPrice || 0;
    const items = getItemsForTracking();
    
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

    const eventPayload = {
        currency: 'USD',
        value: subtotal,
        items: items,
        ...userDataPayload
    };

    trackEvent('InitiateCheckout', eventPayload);
    sendServerSideEvent('InitiateCheckout', eventPayload);


    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (onComplete: () => void) => {
    
    const orderRequest: CreateOrderRequest = {
      partner: orderDraft.partner,
      serviceItems: orderDraft.serviceItems || [],
      clientDetails: orderDraft.clientDetails!,
      pickupTime: orderDraft.pickupTime!,
      appliedPromoCode: orderDraft.appliedPromoCode,
      useLoyaltyPoints: orderDraft.pointsDiscount,
      paymentMethod: 'mobile_money', // Mocked for now
      discountAmount: orderDraft.discountAmount,
      pointsDiscount: orderDraft.pointsDiscount,
      referralDiscount: orderDraft.referralDiscount,
    };
    
    try {
      const createdOrder = await addOrderToHistory(orderRequest);
      
      let userDataPayload = {};
      
      // Data for Enhanced Conversions (Google) & Advanced Matching (Meta)
      const details = user || createdOrder.clientDetails;
      const address = user ? user.pickupAddress : createdOrder.clientDetails?.pickupAddress;

      if (details && address) {
        const [firstName, ...lastNameParts] = (details.name || '').split(' ');
        const lastName = lastNameParts.join(' ');

        const userDataForGtm = {
            email: (details as User).email, // Will be undefined for guests, which is fine
            phone_number: details.phone,
            address: {
                first_name: firstName,
                last_name: lastName,
                street: `${address.numero || ''} ${address.avenue || ''}, ${address.quartier || ''}`.trim(),
                city: address.commune,
                country: 'CD'
            }
        };
        
        userDataPayload = {
            user_data: userDataForGtm
        };
      }

      const purchaseEventPayload = {
          transaction_id: createdOrder.id,
          value: createdOrder.totalPrice,
          currency: 'USD',
          items: getItemsForTracking(),
          coupon: createdOrder.appliedPromoCode,
          ...userDataPayload
      };

      // Fire client-side event for GTM
      trackEvent('purchase', purchaseEventPayload);

      // Fire server-side event for CAPI
      sendServerSideEvent('Purchase', purchaseEventPayload);


      setActiveOrder(createdOrder);
      resetOrderDraft();
      setCurrentPage({ name: 'tracking' });
    } catch (error) {
        addNotification(t('orderPage.orderCreationError'), 'error');
    } finally {
        onComplete();
    }
  };

  if (step === 0) {
    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <ServiceTypeSelector onNext={() => setStep(1)} />
        </div>
    );
  }

  if (step === 1) {
    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <PressingSelector onNext={() => setStep(2)} onBack={() => { updateOrderDraft({ serviceType: undefined }); setStep(0); }} />
        </div>
    );
  }

  if (step === 2 && orderDraft.partner) {
    return (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <MultiServiceOrder 
                    partner={orderDraft.partner} 
                    onNext={() => {}} 
                    onBack={() => {
                        updateOrderDraft({ partner: null, serviceItems: [] });
                        setStep(1);
                    }} 
                />
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card dark:border dark:border-slate-700">
                    <SchedulePicker />
                </div>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card dark:border dark:border-slate-700">
                    <ClientDetailsForm />
                </div>
            </div>
            <div className="lg:col-span-1 sticky top-28">
                <OrderSummary onConfirm={handleOpenPayment} onBack={() => {}} isLoading={isPaymentModalOpen} />
            </div>
        </div>
        {isPromptingRegistration && (
            <RegistrationPromptModal
            isOpen={isPromptingRegistration}
            onClose={() => setIsPromptingRegistration(false)}
            onRegister={() => {
                setIsPromptingRegistration(false);
                setCurrentPage({ name: 'register' });
            }}
            />
        )}
        <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            onConfirmPayment={handleConfirmPayment}
        />
        </>
    );
  }

  // Fallback case
  return null;
};