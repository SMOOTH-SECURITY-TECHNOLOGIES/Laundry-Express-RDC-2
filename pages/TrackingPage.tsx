
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { OrderStatusTracker } from '../components/OrderStatusTracker';
import { OrderStatus, Order } from '../types';
import { ReviewModal } from '../components/ReviewModal';
import { OrderTrackingMap } from '../components/OrderTrackingMap';
// FIX: Using correct PascalCase for the implementation file import to resolve casing and export errors.
import { ChatModal } from '../components/ChatModal';
import { Icon } from '../components/Icon';
import { formatAddress } from '../types';

export const TrackingPage: React.FC = () => {
  const { 
    activeOrder, setActiveOrder, setCurrentPage, 
    resetOrderDraft, submitReview, getUserById, 
    openChatForOrderId, setOpenChatForOrderId, t 
  } = useAppContext();
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (openChatForOrderId && activeOrder && openChatForOrderId === activeOrder.id) {
        setIsChatOpen(true);
        setOpenChatForOrderId(null); // Reset after opening
    }
  }, [openChatForOrderId, activeOrder, setOpenChatForOrderId]);

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (activeOrder) {
      await submitReview(activeOrder.id, rating, comment);
      setIsReviewModalOpen(false);
      setCurrentPage({ name: 'profile' });
    }
  };

  if (!activeOrder) {
    return (
      <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:border dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-4">{t('trackingPage.noActiveOrder')}</h2>
        <p className="text-gray-600 dark:text-slate-300 mb-6">{t('trackingPage.noActiveOrderSubtitle')}</p>
        <button
          onClick={() => setCurrentPage({ name: 'order' })}
          className="px-6 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90"
        >
          {t('trackingPage.orderNow')}
        </button>
      </div>
    );
  }
  
  if (activeOrder.status === OrderStatus.REJECTED) {
    return (
       <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card dark:border dark:border-slate-700 text-center">
        <h1 className="text-3xl font-bold text-center mb-2">{t('trackingPage.orderRejected')}</h1>
        <p className="text-center text-gray-500 dark:text-slate-400 mb-8">{t('trackingPage.orderId', { id: activeOrder.id })}</p>
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded-r-lg text-left">
          <h3 className="font-bold">{t('trackingPage.orderRejectedReason')}</h3>
          <p className="mt-2">{t('trackingPage.reason', { reason: activeOrder.rejectionReason || t('trackingPage.defaultRejectionReason') })}</p>
          <p className="mt-1 text-sm">{t('trackingPage.noCharge')}</p>
        </div>
        <button
          onClick={() => {
            resetOrderDraft();
            setActiveOrder(null);
            setCurrentPage({ name: 'order' });
          }}
          className="mt-8 px-6 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90"
        >
          {t('trackingPage.newOrder')}
        </button>
      </div>
    )
  }

  const canShowMap = activeOrder.partner?.coordinates && activeOrder.clientDetails?.coordinates;
  const canChat = activeOrder.status !== OrderStatus.COMPLETED;
  
  const driver = useMemo(() => {
      if (!activeOrder?.driverId) return null;
      return getUserById(activeOrder.driverId);
  }, [activeOrder, getUserById]);

  const originalPrice = activeOrder.totalPrice + (activeOrder.discountAmount || 0) + (activeOrder.pointsDiscount || 0) + (activeOrder.referralDiscount || 0);

  return (
    <>
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card dark:border dark:border-slate-700">
        <div className="flex justify-between items-start mb-2">
          <div className="text-left">
            <h1 className="text-3xl font-bold">{t('trackingPage.trackYourOrder')}</h1>
            <p className="text-gray-500 dark:text-slate-400 font-mono text-sm">ID : {activeOrder.id}</p>
          </div>
          {canChat && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="px-4 py-2 bg-brand-dark text-white font-semibold rounded-lg hover:bg-opacity-90 flex items-center space-x-2"
            >
              <Icon name="chatBubble" className="w-5 h-5" />
              <span>{t('trackingPage.openChat')}</span>
            </button>
          )}
        </div>
        <hr className="my-6 border-slate-200 dark:border-slate-700"/>
        
        {activeOrder.status === OrderStatus.READY_FOR_PICKUP && (
            <div className="mb-8 p-6 border rounded-lg bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50 space-y-2 animate-fade-in text-center">
                 <div className="w-12 h-12 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <h3 className="font-bold text-lg text-orange-800 dark:text-orange-200">
                    {t('trackingPage.awaitingDriver')}
                </h3>
            </div>
        )}
        
        {activeOrder.status === OrderStatus.READY_FOR_DELIVERY && (
            <div className="mb-8 p-6 border rounded-lg bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50 space-y-2 animate-fade-in text-center">
                 <div className="w-12 h-12 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <h3 className="font-bold text-lg text-orange-800 dark:text-orange-200">
                    {t('trackingPage.readyForDelivery')}
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">{t('trackingPage.readyForDeliverySubtitle')}</p>
            </div>
        )}

        {driver && [OrderStatus.PICKUP, OrderStatus.DELIVERY].includes(activeOrder.status) && (
            <div className="mb-8 p-6 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 space-y-2 animate-fade-in">
                <h3 className="font-bold text-lg text-brand-dark dark:text-blue-200 flex items-center space-x-2">
                    <Icon name="truck" className="w-6 h-6 text-brand-blue" />
                    <span>{t('trackingPage.driverInfo')}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400">{t('trackingPage.driverName')}</p>
                        <p className="font-semibold text-base">{driver.name}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400">{t('trackingPage.vehicleInfo')}</p>
                        <p className="font-semibold text-base font-mono">{driver.vehicleInfo}</p>
                    </div>
                </div>
            </div>
        )}
        
        {canShowMap && (
          <div className="mb-8">
            <OrderTrackingMap order={activeOrder} />
          </div>
        )}
        
        <div className="mb-8 p-6 border rounded-lg bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              <div>
                  <p className="text-slate-500 dark:text-slate-400">{t('trackingPage.service')}</p>
                  <p className="font-semibold text-base text-brand-dark dark:text-slate-100">{activeOrder.serviceItems.map(si => si.service.title).join(', ')}</p>
              </div>
              {activeOrder.partner && (
                <div>
                    <p className="text-slate-500 dark:text-slate-400">{t('trackingPage.partner')}</p>
                    <p className="font-semibold text-base text-brand-dark dark:text-slate-100">{activeOrder.partner.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{activeOrder.partner.address}</p>
                </div>
              )}
              <div>
                  <p className="text-slate-500 dark:text-slate-400">{t('trackingPage.scheduledPickup')}</p>
                  <p className="font-semibold text-base text-brand-dark dark:text-slate-100">{activeOrder.pickupTime}</p>
              </div>
               {activeOrder.estimatedCompletionTime && (
                <div>
                    <p className="text-slate-500 dark:text-slate-400">{t('trackingPage.estimatedCompletion')}</p>
                    <p className="font-semibold text-base text-brand-dark dark:text-slate-100">{activeOrder.estimatedCompletionTime}</p>
                </div>
              )}
          </div>
          {activeOrder.clientDetails && (
            <>
              <hr className="my-4 border-slate-200 dark:border-slate-700"/>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                  <div>
                      <p className="text-slate-500 dark:text-slate-400">{t('trackingPage.customerInfo')}</p>
                      <p className="font-semibold text-brand-dark dark:text-slate-100">{activeOrder.clientDetails.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{activeOrder.clientDetails.phone}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatAddress(activeOrder.clientDetails.pickupAddress)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">{t('trackingPage.articles')}</p>
                      <div className="mt-1 text-sm space-y-1 font-semibold text-brand-dark dark:text-slate-100">
                          {activeOrder.serviceItems.map(si => {
                              const itemCount = si.items ? si.items.reduce((acc, item) => acc + item.quantity, 0) : 0;
                              if (si.service.priceModel === 'per_kg' && si.weight) {
                                  return <div key={si.service.id}>{si.service.title}: {si.weight.toFixed(1)} kg</div>
                              }
                              if (si.service.priceModel === 'per_item' && itemCount > 0) {
                                  return <div key={si.service.id}>{si.service.title}: {t('trackingPage.itemsCount', { count: itemCount })}</div>
                              }
                              return null;
                          })}
                      </div>
                  </div>
                  <div className="text-right md:text-left">
                      <p className="text-slate-500 dark:text-slate-400">{t('trackingPage.totalPaid')}</p>
                        <div className="text-sm">
                            {((activeOrder.totalPrice + (activeOrder.discountAmount || 0) + (activeOrder.pointsDiscount || 0) + (activeOrder.referralDiscount || 0)) > activeOrder.totalPrice) && (
                               <p className="text-slate-500 dark:text-slate-400 line-through">{(activeOrder.totalPrice + (activeOrder.discountAmount || 0) + (activeOrder.pointsDiscount || 0) + (activeOrder.referralDiscount || 0)).toFixed(2)} $</p>
                            )}
                            {activeOrder.discountAmount && activeOrder.discountAmount > 0 && (
                                <p className="text-brand-success font-semibold">{t('trackingPage.promoDiscount', { code: activeOrder.appliedPromoCode, amount: activeOrder.discountAmount.toFixed(2) })}</p>
                            )}
                             {activeOrder.referralDiscount && activeOrder.referralDiscount > 0 && (
                                <p className="text-brand-success font-semibold">{t('trackingPage.referralDiscount', { amount: activeOrder.referralDiscount.toFixed(2) })}</p>
                            )}
                            {activeOrder.pointsDiscount && activeOrder.pointsDiscount > 0 && (
                                <p className="text-brand-success font-semibold">{t('trackingPage.loyaltyDiscount', { amount: activeOrder.pointsDiscount.toFixed(2) })}</p>
                            )}
                        </div>
                      <p className="font-bold text-lg text-brand-dark dark:text-slate-100">{activeOrder.totalPrice?.toFixed(2)} $</p>
                  </div>
              </div>
            </>
          )}
        </div>

        <OrderStatusTracker order={activeOrder} />

        {activeOrder.status === OrderStatus.COMPLETED && (
          <div className="text-center mt-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
            <h3 className="text-xl font-bold text-brand-success">{t('trackingPage.orderCompleted')}</h3>
            {activeOrder.pointsEarned && activeOrder.pointsEarned > 0 && (
                <p className="text-green-700 dark:text-green-300 font-semibold mt-2">{t('trackingPage.pointsEarned', { points: activeOrder.pointsEarned })}</p>
            )}
            
            {!activeOrder.isReviewed ? (
                <>
                    <p className="text-gray-600 dark:text-slate-300 mt-2">{t('trackingPage.howWasExperience')}</p>
                    <div className="mt-4 space-x-4">
                        <button
                            onClick={() => {
                                setActiveOrder(null);
                                setCurrentPage({ name: 'home' });
                            }}
                            className="px-6 py-2 border border-slate-300 text-brand-dark font-semibold rounded-lg hover:bg-slate-100"
                        >
                            {t('trackingPage.later')}
                        </button>
                        <button
                            onClick={() => setIsReviewModalOpen(true)}
                            className="px-6 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90"
                        >
                            {t('trackingPage.leaveReview')}
                        </button>
                    </div>
                </>
            ) : (
                <p className="text-gray-600 dark:text-slate-300 mt-2">{t('trackingPage.thanksForReview')}</p>
            )}
          </div>
        )}
      </div>
      
      <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleSubmitReview}
        order={activeOrder}
      />
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        order={activeOrder}
      />
    </>
  );
};
