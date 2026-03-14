import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, User, NotificationPreferences, RefundRequest, RefundStatus } from '../types';
import { Icon } from '../components/Icon';
import { ReviewModal } from '../components/ReviewModal';
import { ProfileEditModal } from '../components/ProfileEditModal';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useAppContext } from '../context/AppContext';
import { formatAddress } from '../types';
import { RefundRequestModal } from '../components/modals/RefundRequestModal';

const OrderHistoryCard: React.FC<{ 
    order: Order; 
    onReview: (order: Order) => void;
    onRefundRequest: (order: Order) => void;
    refundRequest: RefundRequest | undefined;
}> = ({ order, onReview, onRefundRequest, refundRequest }) => {
  const { t } = useAppContext();

  const getRefundStatusAppearance = (status: RefundStatus) => {
    switch (status) {
        case RefundStatus.APPROVED: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
        case RefundStatus.REJECTED: return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
        case RefundStatus.PENDING:
        default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
    }
  };
  
  return (
    <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl border shadow-card dark:shadow-none flex flex-col sm:flex-row sm:justify-between sm:items-center ${order.status === OrderStatus.REJECTED ? 'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
      <div className="flex-grow">
        <p className="font-bold text-brand-dark dark:text-slate-100">{order.serviceItems.map(si => si.service.title).join(', ')}</p>
        {order.partner && <p className="text-sm text-slate-600 dark:text-slate-300">{t('profilePage.partnerLabel', { name: order.partner.name })}</p>}
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">ID: {order.id}</p>
      </div>
      <div className="mt-4 sm:mt-0 text-right sm:shrink-0 sm:ml-4 flex flex-col items-end justify-between">
          <div className="text-right">
              <p className="font-semibold text-lg">{order.totalPrice.toFixed(2)} $</p>
              <span className={`px-3 py-1 mt-2 inline-block text-xs font-semibold rounded-full ${
                order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                order.status === OrderStatus.REJECTED ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
              }`}>
                {t(`orderStatus.${order.status}`)}
              </span>
              {refundRequest && (
                  <span className={`px-3 py-1 mt-2 ml-2 inline-block text-xs font-semibold rounded-full ${getRefundStatusAppearance(refundRequest.status)}`}>
                    {t(`refundStatus.${refundRequest.status}`)}
                  </span>
              )}
          </div>
          <div className="mt-3 flex flex-col sm:flex-row items-end sm:items-center gap-2">
            {order.status === OrderStatus.COMPLETED && !order.refundRequestId && (
                 <button onClick={() => onRefundRequest(order)} className="px-3 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-full hover:bg-slate-300 whitespace-nowrap">
                  {t('profilePage.requestRefund')}
                </button>
            )}
            {order.status === OrderStatus.COMPLETED && !order.isReviewed && (
                <button onClick={() => onReview(order)} className="px-3 py-1.5 text-xs font-semibold bg-brand-blue text-white rounded-full hover:bg-opacity-90 whitespace-nowrap">
                    {t('profilePage.leaveReview')}
                </button>
            )}
          </div>
      </div>
    </div>
  );
}

const ToggleSwitch: React.FC<{checked: boolean, onChange: () => void, label: string, description: string}> = ({checked, onChange, label, description}) => (
    <div className="flex items-center justify-between">
        <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{label}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
        </label>
    </div>
);

const NotificationPreferencesCard: React.FC<{
  user: User;
  onSave: (preferences: NotificationPreferences) => Promise<void>;
  isSaving: boolean;
}> = ({ user, onSave, isSaving }) => {
  const { t } = useAppContext();
  const defaultPrefs: NotificationPreferences = {
    newOrder: true,
    orderStatusChange: true,
    newChatMessage: true,
    promotions: true,
    general: true,
  };
  const [preferences, setPreferences] = useState<NotificationPreferences>(user.notificationPreferences || defaultPrefs);
  
  useEffect(() => {
    setPreferences(user.notificationPreferences || defaultPrefs);
  }, [user.notificationPreferences]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveClick = async () => {
    await onSave(preferences);
  };
  
  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(user.notificationPreferences || defaultPrefs);

  const preferenceItems = [
    ...(user.partnerId ? [{ key: 'newOrder', label: t('profilePage.prefs.newOrder.label'), description: t('profilePage.prefs.newOrder.desc') }] : []),
    ...(!user.partnerId && user.role !== 'driver' ? [{ key: 'orderStatusChange', label: t('profilePage.prefs.orderStatusChange.label'), description: t('profilePage.prefs.orderStatusChange.desc') }] : []),
    { key: 'newChatMessage', label: t('profilePage.prefs.newChatMessage.label'), description: t('profilePage.prefs.newChatMessage.desc') },
    ...(!user.partnerId && user.role !== 'driver' ? [{ key: 'promotions', label: t('profilePage.prefs.promotions.label'), description: t('profilePage.prefs.promotions.desc') }] : []),
    { key: 'general', label: t('profilePage.prefs.general.label'), description: t('profilePage.prefs.general.desc') },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-4">{t('profilePage.notificationPreferences')}</h2>
        <div className="space-y-4">
            {preferenceItems.map(item => (
                <ToggleSwitch 
                    key={item.key}
                    label={item.label}
                    description={item.description}
                    checked={preferences[item.key as keyof NotificationPreferences] === true}
                    onChange={() => handleToggle(item.key as keyof NotificationPreferences)}
                />
            ))}
        </div>
        {hasChanges && (
            <div className="flex justify-end mt-6 pt-4 border-t dark:border-slate-700">
                <button 
                    onClick={handleSaveClick}
                    disabled={isSaving}
                    className="px-6 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90 disabled:bg-slate-400 disabled:cursor-wait"
                >
                    {isSaving ? t('buttons.saving') : t('profilePage.saveChanges')}
                </button>
            </div>
        )}
    </div>
  );
};

const PushNotificationsCard: React.FC<{ user: User; onUpdate: (user: User) => Promise<User>; }> = ({ user, onUpdate }) => {
    const { t } = useAppContext();
    const [permission, setPermission] = useState(Notification.permission);
    const [isSubscribing, setIsSubscribing] = useState(false);
    
    const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;

    const handleEnablePush = async () => {
        if (!isPushSupported) return;
        setIsSubscribing(true);

        try {
            const requestedPermission = await Notification.requestPermission();
            setPermission(requestedPermission);

            if (requestedPermission === 'granted') {
                const registration = await navigator.serviceWorker.ready;
                // This is a placeholder VAPID key. In a real application, this would be generated
                // on the server and the public key provided to the frontend.
                // The key here is intentionally invalid and shortened for demonstration.
                const applicationServerKey = 'BGl4f2yvx3g5D_83yL-sR-2h_qgXbiS2sT8sZ....';
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey,
                });
                
                // FIX: Pass the subscription object directly to match the `PushSubscription` type.
                await onUpdate({ ...user, isPushEnabled: true, pushSubscription: subscription });
            } else {
                 await onUpdate({ ...user, isPushEnabled: false, pushSubscription: undefined });
            }
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
        } finally {
            setIsSubscribing(false);
        }
    };

    const getStatusInfo = () => {
        if (!isPushSupported) return { text: t('profilePage.push.notSupported', {default: "Not supported on this browser."}), color: 'text-slate-500 dark:text-slate-400' };
        if (permission === 'denied') return { text: t('profilePage.push.blocked', {default: "Blocked. Please enable in browser settings."}), color: 'text-red-500 dark:text-red-400' };
        if (user.isPushEnabled) return { text: t('profilePage.push.enabled', {default: "Enabled."}), color: 'text-green-600 dark:text-green-400' };
        return { text: t('profilePage.push.disabled', {default: "Disabled."}), color: 'text-slate-600 dark:text-slate-300' };
    };
    
    const { text, color } = getStatusInfo();

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-4">{t('profilePage.push.title', {default: "Push Notifications"})}</h2>
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{t('profilePage.push.status', {default: "Current Status:"})}</p>
                    <p className={`text-sm font-semibold ${color}`}>{text}</p>
                </div>
                {!user.isPushEnabled && permission !== 'denied' && isPushSupported && (
                    <button 
                        onClick={handleEnablePush}
                        disabled={isSubscribing}
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-lg hover:bg-opacity-90 disabled:bg-slate-400"
                    >
                        {isSubscribing ? t('buttons.loading') : t('profilePage.push.enableButton', {default: "Enable Notifications"})}
                    </button>
                )}
            </div>
            {permission === 'denied' && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('profilePage.push.blockedHint', {default: "You need to allow notifications in your browser's site settings to enable this feature."})}</p>}
        </div>
    );
};


export const ProfilePage: React.FC = () => {
  const { 
    user, updateUser, 
    orderHistory, submitReview, isLoading,
    setCurrentPage,
    addNotification,
    t,
    loyaltySettings, referralSettings,
    generatePersonalizedRecommendation,
    refundRequests,
  } = useAppContext();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    if (user) {
      generatePersonalizedRecommendation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleOpenReviewModal = (order: Order) => {
    setSelectedOrder(order);
    setIsReviewModalOpen(true);
  };

  const handleOpenRefundModal = (order: Order) => {
    setSelectedOrder(order);
    setIsRefundModalOpen(true);
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (selectedOrder) {
      await submitReview(selectedOrder.id, rating, comment);
      setIsReviewModalOpen(false);
      setSelectedOrder(null);
    }
  };

  const handleSaveProfile = async (updatedUser: User) => {
    setIsSaving(true);
    try {
        await updateUser(updatedUser);
        addNotification(t('notifications.userProfileUpdated', { default: 'Profil mis à jour avec succès.' }), 'success');
        setIsEditModalOpen(false);
    } catch (error) {
        addNotification(t('notifications.userProfileUpdateError', { default: 'Erreur lors de la mise à jour.' }), 'error');
    } finally {
        setIsSaving(false);
    }
  }

  const handleSavePreferences = async (preferences: NotificationPreferences) => {
    if (!user) return;
    setIsSavingPrefs(true);
    try {
      await updateUser({ ...user, notificationPreferences: preferences });
      addNotification(t('notifications.preferencesUpdated'), 'success');
    } catch (error) {
      addNotification(t('notifications.preferencesUpdateError'), 'error');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleCopyCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode)
        .then(() => {
          addNotification(t('profilePage.codeCopied'), 'success');
        })
        .catch(err => {
          addNotification(t('profilePage.copyError'), 'error');
          console.error('Failed to copy text: ', err);
        });
    }
  };

  if (!user) {
    return (
      <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:border dark:border-slate-700 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4">{t('profilePage.personalSpace')}</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">{t('profilePage.loginToView')}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setCurrentPage({ name: 'login' })}
            className="px-6 py-2 bg-brand-blue text-white font-semibold rounded-full hover:bg-opacity-90"
          >
            {t('profilePage.login')}
          </button>
          <button
            onClick={() => setCurrentPage({ name: 'register' })}
            className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-brand-dark dark:text-slate-100 font-semibold rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t('profilePage.createAccount')}
          </button>
        </div>
      </div>
    )
  }

  const userOrderHistory = orderHistory.filter(o => o.userId === user.id);
  const refundRequestsMap = new Map(refundRequests.map(r => [r.orderId, r]));

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-3xl font-bold">{t('profilePage.myProfile')}</h1>
            <button
                onClick={() => setCurrentPage({ name: 'order' })}
                className="px-5 py-2 bg-brand-blue text-white font-bold rounded-full text-base hover:bg-opacity-90 transform hover:scale-105 transition-transform duration-300 flex items-center space-x-2 shadow-md"
            >
                <Icon name="shoppingBag" className="w-5 h-5" />
                <span>{t('profilePage.orderNow')}</span>
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Loyalty Program Card */}
            {loyaltySettings.isEnabled && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700 flex flex-col">
                  <div className="flex items-center mb-4">
                      <Icon name="star" className="w-8 h-8 text-yellow-400 mr-3" />
                      <h2 className="text-2xl font-bold">{t('profilePage.loyaltyProgram')}</h2>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">{t('profilePage.loyaltySubtitle')}</p>
                  <div className="text-center bg-brand-lightblue dark:bg-brand-blue/20 p-4 rounded-lg mt-auto">
                      <p className="text-sm font-semibold text-brand-dark dark:text-brand-lightblue">{t('profilePage.yourPointsBalance')}</p>
                      <p className="text-4xl font-extrabold text-brand-blue dark:text-white">{user.loyaltyPoints}</p>
                  </div>
              </div>
            )}

            {/* Referral Program Card */}
            {referralSettings.isEnabled && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700 flex flex-col">
                   <div className="flex items-center mb-4">
                      <Icon name="user" className="w-8 h-8 text-brand-cyan mr-3" />
                      <h2 className="text-2xl font-bold">{t('profilePage.referralProgram')}</h2>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    {t('profilePage.referralSubtitleDynamic', {
                      discountAmount: referralSettings.refereeDiscountAmount,
                      bonusPoints: referralSettings.referrerBonusPoints
                    })}
                  </p>
                  <div className="text-center border-2 border-dashed border-slate-300 dark:border-slate-600 p-4 rounded-lg mt-auto">
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('profilePage.yourReferralCode')}</p>
                      <p className="text-3xl font-extrabold text-brand-dark dark:text-slate-100 tracking-widest my-2">{user.referralCode}</p>
                      <button onClick={handleCopyCode} className="w-full px-4 py-2 bg-brand-dark text-white font-semibold rounded-lg hover:bg-opacity-90 text-sm">
                          {t('profilePage.copyCode')}
                      </button>
                  </div>
              </div>
            )}
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{t('profilePage.myInfo')}</h2>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-4 py-2 text-sm font-medium text-brand-blue bg-blue-100 dark:bg-blue-900/40 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 flex items-center space-x-2"
                    >
                        <Icon name="pencil" className="w-4 h-4" />
                        <span>{t('profilePage.editInfo')}</span>
                    </button>
                    <button 
                        onClick={() => setCurrentPage({ name: 'support' })}
                        className="px-4 py-2 text-sm font-medium text-brand-dark dark:text-slate-100 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center space-x-2"
                    >
                        <Icon name="lifebuoy" className="w-5 h-5" />
                        <span>{t('profilePage.contactSupport')}</span>
                    </button>
                </div>
            </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-slate-700 dark:text-slate-200">
            <div className="flex items-start">
              <Icon name="user" className="w-6 h-6 mr-3 text-brand-blue shrink-0 mt-1" />
              <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('profilePage.name')}</p>
                  <p className="font-semibold">{user.name}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Icon name="mapPin" className="w-6 h-6 mr-3 text-brand-blue shrink-0 mt-1" />
              <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('profilePage.defaultAddress')}</p>
                  <p className="font-semibold">{formatAddress(user.pickupAddress)}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Icon name="user" className="w-6 h-6 mr-3 text-brand-blue shrink-0 mt-1" />
              <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('profilePage.email')}</p>
                  <p className="font-semibold">{user.email}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Icon name="user" className="w-6 h-6 mr-3 text-brand-blue shrink-0 mt-1" />
              <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('profilePage.phone')}</p>
                  <p className="font-semibold">{user.phone}</p>
              </div>
            </div>
          </div>
        </div>

        <NotificationPreferencesCard user={user} onSave={handleSavePreferences} isSaving={isSavingPrefs} />

        <PushNotificationsCard user={user} onUpdate={updateUser} />

        <div>
            <h2 className="text-2xl font-bold mb-4">{t('profilePage.orderHistory')}</h2>
            <div className="space-y-4" aria-live="polite">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <SkeletonLoader key={i} type="list-item" />)
                ) : userOrderHistory.length > 0 ? (
                    userOrderHistory.map(order => (
                        <OrderHistoryCard 
                            key={order.id} 
                            order={order} 
                            onReview={handleOpenReviewModal}
                            onRefundRequest={handleOpenRefundModal}
                            refundRequest={refundRequestsMap.get(order.id)}
                        />
                    ))
                ) : (
                    <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:shadow-none border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <Icon name="shirt" className="mx-auto h-20 w-20 text-slate-300 dark:text-slate-600" />
                        <h3 className="mt-4 text-2xl font-bold text-brand-dark dark:text-slate-100">{t('profilePage.noOrders')}</h3>
                        <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md mx-auto">{t('profilePage.noOrdersSubtitle')}</p>
                    </div>
                )}
            </div>
        </div>
      </div>
      <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleSubmitReview}
        order={selectedOrder}
      />
      <RefundRequestModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        order={selectedOrder}
      />
       <ProfileEditModal
        user={user}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
        isSaving={isSaving}
      />
    </>
  );
};