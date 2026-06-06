import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from './Icon';
import { Order, ServiceItem, User, DiscountType } from '../types';
import { trackEvent } from '../utils/tracking';

interface OrderSummaryProps {
  onConfirm: () => void;
  onBack: () => void;
  isLoading: boolean;
}

interface DiscountInfo {
  type: DiscountType;
  amount: number;
  label: string;
  code?: string;
  removable?: boolean;
}

// Constants
const VALIDATION_RULES = {
  MIN_SUBTOTAL: 0,
  MAX_PROMO_ATTEMPTS: 3,
} as const;

const TRACKING_EVENTS = {
  ADD_TO_CART: 'AddToCart',
  PROMO_APPLIED: 'PromoCodeApplied',
  POINTS_REDEEMED: 'LoyaltyPointsRedeemed',
  PROMO_REMOVED: 'PromoCodeRemoved',
  POINTS_REMOVED: 'LoyaltyPointsRemoved',
} as const;

// Utility functions
const calculateServiceItemTotal = (si: ServiceItem): number => {
  if (si.service.priceModel === 'per_kg') {
    return (si.weight || 0) * (si.service.price || 0);
  } else if (si.service.priceModel === 'per_item') {
    return si.items?.reduce((total, item) => total + (item.article.price * item.quantity), 0) || 0;
  }
  return 0;
};

const calculateTotal = (serviceItems: ServiceItem[] = []): number => {
  return serviceItems.reduce((total, si) => total + calculateServiceItemTotal(si), 0);
};

const calculateTotalItems = (serviceItems: ServiceItem[] = []): number => {
  return serviceItems.reduce((acc, si) => {
    if (si.service.priceModel === 'per_kg') {
      return acc + (si.weight && si.weight > 0 ? 1 : 0);
    }
    return acc + (si.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0);
  }, 0);
};

// Custom hooks
const useDiscountCalculator = (
  subtotal: number,
  orderDraft: Order,
  user: User | null,
  loyaltySettings: any,
  referralSettings: any
) => {
  const { discountAmount, pointsDiscount, referralDiscount, appliedPromoCode } = orderDraft;

  const discounts = useMemo((): DiscountInfo[] => {
    const discountList: DiscountInfo[] = [];

    if (referralDiscount && referralDiscount > 0) {
      discountList.push({
        type: DiscountType.REFERRAL,
        amount: referralDiscount,
        label: 'orderSummary.welcomeDiscount',
        removable: false,
      });
    }

    if (appliedPromoCode && discountAmount && discountAmount > 0) {
      discountList.push({
        type: DiscountType.PROMO,
        amount: discountAmount,
        label: 'orderSummary.promoDiscount',
        code: appliedPromoCode,
        removable: true,
      });
    }

    if (pointsDiscount && pointsDiscount > 0) {
      discountList.push({
        type: DiscountType.LOYALTY,
        amount: pointsDiscount,
        label: 'orderSummary.loyaltyDiscount',
        removable: true,
      });
    }

    return discountList;
  }, [referralDiscount, appliedPromoCode, discountAmount, pointsDiscount]);

  const maxPointsDiscount = useMemo(() => {
    if (!user || !loyaltySettings.isEnabled || loyaltySettings.pointsToDollar <= 0) return 0;
    return Math.floor(user.loyaltyPoints / loyaltySettings.pointsToDollar);
  }, [user, loyaltySettings]);

  const redeemableAmount = useMemo(() => {
    const currentDiscountsTotal = discounts.reduce((sum, discount) => sum + discount.amount, 0);
    return Math.min(maxPointsDiscount, Math.max(0, subtotal - currentDiscountsTotal));
  }, [maxPointsDiscount, subtotal, discounts]);

  const totalDiscount = useMemo(() => 
    discounts.reduce((sum, discount) => sum + discount.amount, 0), 
    [discounts]
  );

  const finalTotal = useMemo(() => 
    Math.max(0, subtotal - totalDiscount), 
    [subtotal, totalDiscount]
  );

  return {
    discounts,
    maxPointsDiscount,
    redeemableAmount,
    totalDiscount,
    finalTotal,
  };
};

const useOrderValidation = (orderDraft: Order, subtotal: number) => {
  const { clientDetails, pickupTime } = orderDraft;

  return useMemo(() => {
    const errors: string[] = [];
    
    if (!clientDetails?.name) errors.push('validation.missingName');
    if (!clientDetails?.phone) errors.push('validation.missingPhone');
    if (!pickupTime) errors.push('validation.missingPickupTime');
    if (subtotal <= VALIDATION_RULES.MIN_SUBTOTAL) errors.push('validation.noItems');
    
    const address = clientDetails?.pickupAddress;
    if (!address?.commune || !address?.avenue || !address?.numero) {
      errors.push('validation.incompleteAddress');
    }
    
    return {
      canProceed: errors.length === 0,
      errors,
    };
  }, [clientDetails, pickupTime, subtotal]);
};

const ServiceItemDisplay: React.FC<{item: ServiceItem, t: (key: string, options?: any) => string}> = ({ item, t }) => {
    const itemCount = item.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
    const itemTotal = calculateServiceItemTotal(item);

    return (
        <div className="flex justify-between items-center text-sm">
            <div>
                <p className="font-semibold">{item.service.title}</p>
                {item.service.priceModel === 'per_kg' && <p className="text-xs text-slate-500">{item.weight}kg</p>}
                {item.service.priceModel === 'per_item' && <p className="text-xs text-slate-500">{itemCount} {t('trackingPage.articles', { count: itemCount })}</p>}
            </div>
            <p className="font-semibold">${itemTotal.toFixed(2)}</p>
        </div>
    );
};

const PriceBreakdown: React.FC<{subtotal: number, discounts: DiscountInfo[], finalTotal: number, t: (key: string, options?: any) => string}> = ({ subtotal, discounts, finalTotal, t }) => (
    <div className="py-4 border-t border-b dark:border-slate-700 space-y-2">
        <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-300">{t('orderSummary.estimatedSubtotal')}</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        {discounts.map(discount => (
            <div key={discount.type} className="flex justify-between text-sm text-green-600">
                <span>{t(discount.label, { code: discount.code })}</span>
                <span>-${discount.amount.toFixed(2)}</span>
            </div>
        ))}
        <div className="flex justify-between font-bold text-lg pt-2">
            <span>{t('orderSummary.estimatedTotal')}</span>
            <span>${finalTotal.toFixed(2)}</span>
        </div>
    </div>
);

const LoyaltyPointsSection: React.FC<{
    user: User | null;
    loyaltySettings: any;
    pointsDiscount?: number;
    redeemableAmount: number;
    pointsToUse: number;
    onApplyPoints: () => void;
    onRemovePoints: () => void;
    t: (key: string, options?: any) => string;
}> = ({ user, loyaltySettings, pointsDiscount, redeemableAmount, pointsToUse, onApplyPoints, onRemovePoints, t }) => {
    if (!user || !loyaltySettings.isEnabled || user.loyaltyPoints === 0) return null;

    if (pointsDiscount && pointsDiscount > 0) {
        return (
             <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex justify-between items-center text-sm">
                <p className="font-semibold text-green-700 dark:text-green-300">{t('orderSummary.loyaltyDiscountApplied')}</p>
                <button onClick={onRemovePoints} className="font-semibold text-red-500 hover:underline">{t('orderSummary.remove')}</button>
            </div>
        );
    }
    
    if (redeemableAmount > 0) {
        return (
             <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm">
                <p>{t('orderSummary.youHavePoints', { points: user.loyaltyPoints })}</p>
                <p>{t('orderSummary.usePointsForDiscount', { points: pointsToUse, amount: redeemableAmount.toFixed(2) })}</p>
                <button onClick={onApplyPoints} className="mt-2 font-semibold text-brand-blue hover:underline">{t('orderSummary.apply')}</button>
            </div>
        );
    }

    return (
        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm">
            <p>{t('orderSummary.youHavePoints', { points: user.loyaltyPoints })}</p>
            <p className="text-slate-500">{t('orderSummary.notEnoughPoints')}</p>
        </div>
    );
};

const PromoCodeSection: React.FC<{
    appliedPromoCode?: string;
    promoCodeInput: string;
    isApplyingPromo: boolean;
    promoMessage: {type: 'success' | 'error', text: string} | null;
    onPromoCodeChange: (value: string) => void;
    onApplyPromo: () => void;
    onRemovePromo: () => void;
    onKeyPress: (e: React.KeyboardEvent) => void;
    t: (key: string, options?: any) => string;
}> = ({ appliedPromoCode, promoCodeInput, isApplyingPromo, promoMessage, onPromoCodeChange, onApplyPromo, onRemovePromo, onKeyPress, t }) => {
     if (appliedPromoCode) {
        return (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex justify-between items-center text-sm">
                <p className="font-semibold text-green-700 dark:text-green-300">{t('orderSummary.codeApplied', { code: appliedPromoCode })}</p>
                <button onClick={onRemovePromo} className="font-semibold text-red-500 hover:underline">{t('orderSummary.remove')}</button>
            </div>
        );
    }

    return (
        <div>
            <label className="block text-sm font-medium mb-1">{t('orderSummary.promoCode')}</label>
            <div className="flex space-x-2">
                <input
                    type="text"
                    value={promoCodeInput}
                    onChange={e => onPromoCodeChange(e.target.value.toUpperCase())}
                    onKeyPress={onKeyPress}
                    placeholder={t('orderSummary.promoPlaceholder')}
                    className="flex-grow p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                />
                <button onClick={onApplyPromo} disabled={isApplyingPromo} className="px-4 py-2 bg-brand-dark text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:bg-slate-400">
                    {isApplyingPromo ? t('buttons.loading') : t('orderSummary.apply')}
                </button>
            </div>
            {promoMessage && <p className={`text-xs mt-2 ${promoMessage.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{promoMessage.text}</p>}
        </div>
    );
}


export const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  onConfirm, 
  onBack, 
  isLoading 
}) => {
  const { 
    orderDraft, 
    updateOrderDraft, 
    validatePromoCode, 
    user, 
    orderHistory, 
    loyaltySettings, 
    referralSettings, 
    t 
  } = useAppContext();

  const { 
    partner, 
    appliedPromoCode, 
    discountAmount, 
    pointsDiscount, 
    serviceItems 
  } = orderDraft;

  const [promoCodeInput, setPromoCodeInput] = useState(appliedPromoCode || '');
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const hasFiredAddToCart = useRef(false);

  const subtotal = useMemo(() => calculateTotal(serviceItems), [serviceItems]);
  const totalItems = useMemo(() => calculateTotalItems(serviceItems), [serviceItems]);

  // FIX: Corrected the argument order in the `useDiscountCalculator` hook call to resolve a type error.
  const {
    discounts,
    maxPointsDiscount,
    redeemableAmount,
    finalTotal,
  } = useDiscountCalculator(subtotal, orderDraft as Order, user, loyaltySettings, referralSettings);

  const validation = useOrderValidation(orderDraft as Order, subtotal);

  // Analytics tracking
  useEffect(() => {
    if (totalItems > 0 && !hasFiredAddToCart.current) {
      const items = serviceItems?.flatMap(si => {
        if (si.service.priceModel === 'per_kg') {
          return si.weight && si.weight > 0 ? [{
            item_id: si.service.id,
            item_name: si.service.title,
            price: si.service.price,
            quantity: si.weight || 0,
            item_category: si.service.type
          }] : [];
        }
        return si.items?.map(item => ({
          item_id: item.article.id,
          item_name: item.article.name,
          item_category: si.service.title,
          price: item.article.price,
          quantity: item.quantity
        })) || [];
      }) || [];
      
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

      trackEvent(TRACKING_EVENTS.ADD_TO_CART, {
        currency: 'USD',
        value: subtotal,
        items: items,
        ...userDataPayload
      });
      hasFiredAddToCart.current = true;
    }

    if (totalItems === 0 && hasFiredAddToCart.current) {
      hasFiredAddToCart.current = false;
    }
  }, [serviceItems, orderDraft.clientDetails, subtotal, user, totalItems]);

  // Sync total price
  useEffect(() => {
    if (orderDraft.totalPrice !== subtotal) {
      updateOrderDraft({ totalPrice: subtotal });
    }
  }, [subtotal, orderDraft.totalPrice, updateOrderDraft]);

  // Apply referral discount for first-time users
  useEffect(() => {
    const isFirstOrder = user && orderHistory.filter(o => o.userId === user.id).length === 0;
    if (referralSettings.isEnabled && isFirstOrder && user?.referredByCode && !orderDraft.referralDiscount) {
      updateOrderDraft({ referralDiscount: referralSettings.refereeDiscountAmount });
    }
  }, [user, orderHistory, orderDraft.referralDiscount, updateOrderDraft, referralSettings]);

  // Validate existing promo code
  useEffect(() => {
    if (appliedPromoCode) {
      const result = validatePromoCode(appliedPromoCode, { totalPrice: subtotal, partner });
      if (result.isValid) {
        if (result.discountAmount !== discountAmount) {
          updateOrderDraft({ discountAmount: result.discountAmount });
        }
      } else {
        updateOrderDraft({ appliedPromoCode: undefined, discountAmount: undefined });
        setPromoMessage({ type: 'error', text: result.message });
      }
    }
  }, [subtotal, appliedPromoCode, partner, discountAmount, updateOrderDraft, validatePromoCode]);

  // Sync promo code input
  useEffect(() => {
    setPromoCodeInput(appliedPromoCode || '');
  }, [appliedPromoCode]);

  // Promo code handlers
  const handleApplyPromoCode = useCallback(async () => {
    if (!promoCodeInput.trim()) return;
    
    setIsApplyingPromo(true);
    setPromoMessage(null);
    
    try {
      const result = validatePromoCode(promoCodeInput, orderDraft);
      if (result.isValid) {
      updateOrderDraft({ 
        appliedPromoCode: result.codeData?.code, 
        discountAmount: result.discountAmount 
        });
        setPromoMessage({ type: 'success', text: result.message });
        trackEvent(TRACKING_EVENTS.PROMO_APPLIED, { code: promoCodeInput, discount: result.discountAmount });
      } else {
        setPromoMessage({ type: 'error', text: result.message });
        updateOrderDraft({ appliedPromoCode: undefined, discountAmount: undefined });
      }
    } catch (error) {
      setPromoMessage({ type: 'error', text: t('errors.promoValidationFailed') });
    } finally {
      setIsApplyingPromo(false);
    }
  }, [promoCodeInput, orderDraft, updateOrderDraft, validatePromoCode, t]);

  const handleRemovePromoCode = useCallback(() => {
    updateOrderDraft({ appliedPromoCode: undefined, discountAmount: undefined });
    setPromoCodeInput('');
    setPromoMessage(null);
    trackEvent(TRACKING_EVENTS.PROMO_REMOVED, { code: appliedPromoCode });
  }, [updateOrderDraft, appliedPromoCode]);

  // Loyalty points handlers
  const handleApplyPoints = useCallback(() => {
    if (!user || user.loyaltyPoints <= 0 || !loyaltySettings.isEnabled || loyaltySettings.pointsToDollar <= 0) return;
    
    if (redeemableAmount > 0) {
      updateOrderDraft({
        pointsDiscount: redeemableAmount,
        loyaltyPointsToRedeem: pointsToUse,
      });
      trackEvent(TRACKING_EVENTS.POINTS_REDEEMED, { 
        points: redeemableAmount * loyaltySettings.pointsToDollar,
        discount: redeemableAmount 
      });
    }
  }, [user, loyaltySettings, redeemableAmount, updateOrderDraft]);

  const handleRemovePoints = useCallback(() => {
    updateOrderDraft({ pointsDiscount: undefined, loyaltyPointsToRedeem: undefined });
    trackEvent(TRACKING_EVENTS.POINTS_REMOVED, { points: pointsDiscount });
  }, [updateOrderDraft, pointsDiscount]);

  const pointsToUse = redeemableAmount * loyaltySettings.pointsToDollar;

  // Handle Enter key for promo code
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyPromoCode();
    }
  }, [handleApplyPromoCode]);

  return (
    <div 
      className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700"
      role="region"
      aria-label={t('orderSummary.title')}
    >
      <h2 className="text-xl font-bold mb-4 text-center">{t('orderSummary.title')}</h2>
      
      {/* Service Items List */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-2">
        {serviceItems?.map(si => (
          <ServiceItemDisplay 
            key={si.service.id} 
            item={si} 
            t={t}
          />
        ))}
        {(serviceItems?.length || 0) === 0 && (
          <p className="text-center text-slate-500 py-8">
            {t('orderSummary.noItems', { default: 'Your cart is empty.'})}
          </p>
        )}
      </div>

      {/* Price Breakdown */}
      <PriceBreakdown 
        subtotal={subtotal}
        discounts={discounts}
        finalTotal={finalTotal}
        t={t}
      />
      
      {/* Discounts Section */}
      <div className="space-y-4 my-6">
        <LoyaltyPointsSection 
          user={user}
          loyaltySettings={loyaltySettings}
          pointsDiscount={pointsDiscount}
          redeemableAmount={redeemableAmount}
          pointsToUse={pointsToUse}
          onApplyPoints={handleApplyPoints}
          onRemovePoints={handleRemovePoints}
          t={t}
        />

        <PromoCodeSection 
          appliedPromoCode={appliedPromoCode}
          promoCodeInput={promoCodeInput}
          isApplyingPromo={isApplyingPromo}
          promoMessage={promoMessage}
          onPromoCodeChange={setPromoCodeInput}
          onApplyPromo={handleApplyPromoCode}
          onRemovePromo={handleRemovePromoCode}
          onKeyPress={handleKeyPress}
          t={t}
        />
      </div>
      
      {/* Payment Info */}
      <p className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-brand-blue text-xs text-brand-dark dark:text-blue-200 mb-6">
        {t('orderSummary.paymentInfo')}
      </p>

      {/* Validation Errors */}
      {!validation.canProceed && validation.errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <ul className="text-xs text-red-600 dark:text-red-300 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>• {t(error)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Confirm Button */}
      <button 
        onClick={onConfirm}
        disabled={isLoading || !validation.canProceed}
        className="w-full px-6 py-3 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90 text-lg disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200"
        aria-busy={isLoading}
      >
        {isLoading ? (
            <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                <span>{t('buttons.loading')}</span>
            </>
        ) : (
            t('orderSummary.confirmAndPay')
        )}
      </button>
    </div>
  );
};
