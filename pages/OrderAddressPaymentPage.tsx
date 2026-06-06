import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { DrcAddress } from '../types';
import { validateCheckoutForm } from '../utils/order-validation';
import { getEstimatedTotal, getFinalTotal } from '../utils/order-pricing';
import { appEvents } from '../utils/events';
import {
  CheckoutStepper,
  PickupAddressCard,
  EditAddressModal,
  PickupSlotCard,
  DriverInstructionsCard,
  PaymentMethodCard,
  SecurePaymentCard,
  ConfirmOrderCard,
  CheckoutOrderSummary,
} from '../components/checkout';

interface OrderAddressPaymentPageProps {
  onBack: () => void;
}

export const OrderAddressPaymentPage: React.FC<OrderAddressPaymentPageProps> = ({ onBack }) => {
  const {
    user,
    updateUser,
    orderDraft,
    updateOrderDraft,
    addOrderToHistory,
    setActiveOrder,
    addNotification,
    isLoading,
    formatPrice,
    validatePromoCode,
    setCurrentPage,
  } = useAppContext();

  const [selectedSlot, setSelectedSlot] = useState(orderDraft.pickupTime || '');
  const [driverInstructions, setDriverInstructions] = useState(
    orderDraft.clientDetails?.pickupAddress?.reference || ''
  );
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card'>('cash');
  const [mmDetails, setMmDetails] = useState({ operator: 'M-Pesa', phone: '' });
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '' });
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [promoStatus, setPromoStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  useEffect(() => {
    appEvents.emit('analytics', { event: 'checkout_step_viewed', data: { step: 'address_payment' } });
  }, []);

  const estimatedTotal = getEstimatedTotal(orderDraft);
  const displayTotal = getFinalTotal(orderDraft);

  const handleSlotSelect = useCallback((slot: string) => {
    setSelectedSlot(slot);
    appEvents.emit('analytics', { event: 'pickup_slot_selected', data: { slot } });
  }, []);

  const handleInstructionsChange = useCallback((value: string) => {
    setDriverInstructions(value);
    appEvents.emit('analytics', { event: 'driver_instructions_added', data: { length: value.length } });
  }, []);

  const handlePaymentMethodChange = useCallback((method: 'cash' | 'mobile_money' | 'card') => {
    setPaymentMethod(method);
    appEvents.emit('analytics', { event: 'payment_method_selected', data: { method } });
  }, []);

  const handleEditAddressClick = useCallback(() => {
    setShowEditAddress(true);
    appEvents.emit('analytics', { event: 'pickup_address_edit_clicked' });
  }, []);

  const handleAddressSave = useCallback((address: DrcAddress) => {
    if (!user) return;
    const updatedUser = { ...user, pickupAddress: address };
    updateUser(updatedUser);
    appEvents.emit('analytics', { event: 'pickup_address_updated' });
    setShowEditAddress(false);
    addNotification('Adresse mise à jour avec succès.', 'success');
  }, [user, updateUser, addNotification]);

  const handleApplyPromo = useCallback(async (code: string) => {
    setIsApplyingPromo(true);
    setPromoStatus(null);
    try {
      const result = validatePromoCode(code, orderDraft);
      if (result.isValid) {
        updateOrderDraft({ appliedPromoCode: result.codeData?.code, discountAmount: result.discountAmount });
        setPromoStatus({ type: 'success', message: result.message });
        appEvents.emit('analytics', { event: 'promo_code_applied', data: { code, discount: result.discountAmount } });
      } else {
        setPromoStatus({ type: 'error', message: result.message });
      }
    } catch {
      setPromoStatus({ type: 'error', message: 'Erreur lors de la validation du code promo.' });
    } finally {
      setIsApplyingPromo(false);
    }
  }, [orderDraft, validatePromoCode, updateOrderDraft]);

  const handleRemovePromo = useCallback(() => {
    updateOrderDraft({ appliedPromoCode: undefined, discountAmount: undefined });
    setPromoStatus(null);
    appEvents.emit('analytics', { event: 'promo_code_removed' });
  }, [updateOrderDraft]);

  const handleConfirm = useCallback(async () => {
    if (!user) {
      setCurrentPage({ name: 'login' });
      return;
    }

    const validation = validateCheckoutForm({
      hasAddress: !!user.pickupAddress && !!user.pickupAddress.avenue,
      slot: selectedSlot,
      paymentMethod,
      mmPhone: mmDetails.phone,
      cardNumber: cardDetails.number,
      cardExpiry: cardDetails.expiry,
      cardCvv: cardDetails.cvv,
    });

    if (!validation.isValid) {
      addNotification(validation.errorMessage, 'error');
      return;
    }

    appEvents.emit('analytics', { event: 'confirm_order_clicked' });

    const clientDetails = {
      name: user.name,
      phone: user.phone,
      pickupAddress: {
        ...user.pickupAddress,
        reference: driverInstructions || user.pickupAddress.reference,
      },
    };

    updateOrderDraft({ clientDetails, pickupTime: selectedSlot });

    try {
      const createdOrder = await addOrderToHistory({
        partner: orderDraft.partner,
        serviceItems: orderDraft.serviceItems || [],
        clientDetails,
        pickupTime: selectedSlot,
        appliedPromoCode: orderDraft.appliedPromoCode,
        paymentMethod,
        discountAmount: orderDraft.discountAmount,
        pointsDiscount: orderDraft.pointsDiscount,
        referralDiscount: orderDraft.referralDiscount,
        totalPrice: displayTotal,
      });

      setActiveOrder(createdOrder);
      addNotification('Commande créée avec succès. Vous pouvez maintenant la suivre.', 'success');
      appEvents.emit('analytics', { event: 'order_confirmed', data: { orderId: createdOrder.id } });
      setCurrentPage({ name: 'tracking' });
    } catch {
      appEvents.emit('analytics', { event: 'order_confirm_failed' });
    }
  }, [
    user, selectedSlot, paymentMethod, mmDetails, cardDetails, driverInstructions,
    orderDraft, displayTotal, updateOrderDraft, addOrderToHistory, setActiveOrder,
    addNotification, setCurrentPage,
  ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <CheckoutStepper currentStep={3} />

      <div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-[#00B4D8] transition-colors font-medium text-sm"
        >
          <Icon name="arrowLeft" className="w-4 h-4" />
          Retour à la commande
        </button>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
          Adresse et <span className="text-brand-blue">paiement</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Confirmez le ramassage et choisissez votre mode de paiement.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="w-full lg:w-[65%] space-y-5 sm:space-y-6">
          <PickupAddressCard user={user} onEditClick={handleEditAddressClick} />

          <PickupSlotCard
            selectedSlot={selectedSlot}
            onSlotSelect={handleSlotSelect}
            partner={orderDraft.partner}
          />

          <DriverInstructionsCard
            value={driverInstructions}
            onChange={handleInstructionsChange}
          />

          <PaymentMethodCard
            selectedMethod={paymentMethod}
            onMethodChange={handlePaymentMethodChange}
            mobileMoneyDetails={mmDetails}
            onMobileMoneyDetailsChange={setMmDetails}
            cardDetails={cardDetails}
            onCardDetailsChange={setCardDetails}
          />

          <SecurePaymentCard />

          <ConfirmOrderCard
            total={formatPrice(displayTotal)}
            isLoading={isLoading}
            onConfirm={handleConfirm}
          />
        </div>

        <div className="w-full lg:w-[35%]">
          <div className="lg:sticky lg:top-24">
            <CheckoutOrderSummary
              orderDraft={orderDraft}
              formatPrice={formatPrice}
              appliedPromoCode={orderDraft.appliedPromoCode}
              discountAmount={orderDraft.discountAmount}
              onApplyPromo={handleApplyPromo}
              onRemovePromo={handleRemovePromo}
              promoStatus={promoStatus}
              isApplyingPromo={isApplyingPromo}
            />
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4 z-40 safe-area-bottom">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className="w-full bg-brand-blue hover:bg-brand-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              Confirmer — {formatPrice(displayTotal)}
            </>
          )}
        </button>
      </div>

      <EditAddressModal
        isOpen={showEditAddress}
        onClose={() => setShowEditAddress(false)}
        onSave={handleAddressSave}
        currentAddress={user?.pickupAddress || { commune: '', avenue: '', numero: '' }}
        userName={user?.name || ''}
        userPhone={user?.phone || ''}
      />
    </div>
  );
};
