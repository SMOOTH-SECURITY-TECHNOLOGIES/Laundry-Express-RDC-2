
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { OrderStatus, Order, formatAddress } from '../types';
import { ReviewModal } from '../components/ReviewModal';
import { OrderTrackingMap } from '../components/OrderTrackingMap';
import { ChatModal } from '../components/ChatModal';
import { Icon } from '../components/Icon';
import { useOrderTracking } from '../hooks/useOrderTracking';
import { useMyReviews } from '../hooks/useMyReviews';

const statusConfig: Record<string, { label: string; heroMessage: string; color: string; bgColor: string; borderColor: string; icon: string; progress: number }> = {
  [OrderStatus.AWAITING_CONFIRMATION]: { label: 'Commande reçue', heroMessage: 'Le partenaire doit encore confirmer votre demande.', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800', icon: 'clock', progress: 12 },
  [OrderStatus.CONFIRMED]: { label: 'Commande confirmée', heroMessage: 'Le partenaire a accepté votre commande.', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800', icon: 'check', progress: 25 },
  [OrderStatus.READY_FOR_PICKUP]: { label: 'Chauffeur assigné', heroMessage: 'Un chauffeur est en route pour récupérer vos articles.', color: 'text-brand-blue', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800', icon: 'user', progress: 35 },
  [OrderStatus.PICKUP]: { label: 'Chauffeur en route', heroMessage: 'Le chauffeur se rend chez vous pour le ramassage.', color: 'text-brand-blue', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800', icon: 'truck', progress: 45 },
  [OrderStatus.PROCESSING]: { label: 'En traitement', heroMessage: 'Vos articles sont en cours de nettoyage.', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-200 dark:border-purple-800', icon: 'sparkles', progress: 60 },
  [OrderStatus.READY_FOR_DELIVERY]: { label: 'Prêt pour livraison', heroMessage: 'Vos articles sont prêts et vérifiés.', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', borderColor: 'border-emerald-200 dark:border-emerald-800', icon: 'check', progress: 80 },
  [OrderStatus.DELIVERY]: { label: 'En livraison', heroMessage: 'Le livreur se rend chez vous.', color: 'text-brand-blue', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800', icon: 'truck', progress: 90 },
  [OrderStatus.COMPLETED]: { label: 'Livrée', heroMessage: 'Commande terminée avec succès.', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800', icon: 'check', progress: 100 },
  [OrderStatus.REJECTED]: { label: 'Annulée', heroMessage: 'Commande annulée.', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800', icon: 'xmark', progress: 0 },
  [OrderStatus.DELAYED]: { label: 'En retard', heroMessage: 'Un retard a été signalé.', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-200 dark:border-orange-800', icon: 'warning', progress: 50 },
};

const timelineSteps: { status: OrderStatus; label: string; description: string; etaLabel: string; etaMinutes: number }[] = [
  { status: OrderStatus.AWAITING_CONFIRMATION, label: 'Commande reçue', description: 'Votre commande a été enregistrée', etaLabel: 'Immédiat', etaMinutes: 0 },
  { status: OrderStatus.CONFIRMED, label: 'Partenaire confirmé', description: 'Le pressing a accepté la commande', etaLabel: '~2 min', etaMinutes: 2 },
  { status: OrderStatus.READY_FOR_PICKUP, label: 'Chauffeur assigné', description: 'Un chauffeur récupérera vos articles', etaLabel: '~5 min', etaMinutes: 5 },
  { status: OrderStatus.PICKUP, label: 'Ramassage en cours', description: 'Le chauffeur se rend chez vous', etaLabel: '~15 min', etaMinutes: 15 },
  { status: OrderStatus.PROCESSING, label: 'Nettoyage en cours', description: 'Vos articles sont traités', etaLabel: '~3h', etaMinutes: 180 },
  { status: OrderStatus.READY_FOR_DELIVERY, label: 'Contrôle qualité', description: 'Vérification et pliage', etaLabel: '~30 min', etaMinutes: 30 },
  { status: OrderStatus.DELIVERY, label: 'Livraison en cours', description: 'Le livreur se rend chez vous', etaLabel: '~20 min', etaMinutes: 20 },
  { status: OrderStatus.COMPLETED, label: 'Terminé', description: 'Commande livrée', etaLabel: 'Terminé', etaMinutes: 0 },
];

const notificationPrefs = [
  { id: 'sms', label: 'SMS', icon: 'device-phone-mobile' as const },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'chatBubble' as const },
  { id: 'email', label: 'Email', icon: 'envelope' as const },
];

export const TrackingPage: React.FC = () => {
  const {
    activeOrder: contextActiveOrder, setActiveOrder, setCurrentPage,
    resetOrderDraft, submitReview, getUserById,
    openChatForOrderId, setOpenChatForOrderId,
    formatPrice, t, partners,
  } = useAppContext();

  const { order: trackedOrder } = useOrderTracking({
    orderId: contextActiveOrder?.id ?? null,
    partners,
    fallbackOrder: contextActiveOrder,
  });

  const activeOrder = trackedOrder ?? contextActiveOrder;
  const { reviews: myReviews } = useMyReviews(!!contextActiveOrder?.id);
  const hasSubmittedReview = Boolean(
    activeOrder?.isReviewed || myReviews.some((review) => review.order_id === activeOrder?.id),
  );

  useEffect(() => {
    if (trackedOrder && trackedOrder.id === contextActiveOrder?.id) {
      setActiveOrder(trackedOrder);
    }
  }, [trackedOrder, contextActiveOrder?.id, setActiveOrder]);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ sms: true, whatsapp: true, email: false });

  useEffect(() => {
    if (openChatForOrderId && activeOrder && openChatForOrderId === activeOrder.id) {
      setIsChatOpen(true);
      setOpenChatForOrderId(null);
    }
  }, [openChatForOrderId, activeOrder, setOpenChatForOrderId]);

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (activeOrder) {
      await submitReview(activeOrder.id, rating, comment);
      setIsReviewModalOpen(false);
      setCurrentPage({ name: 'profile' });
    }
  };

  const driver = useMemo(() => {
    if (!activeOrder?.driverId) return null;
    return getUserById(activeOrder.driverId);
  }, [activeOrder, getUserById]);

  const config = statusConfig[activeOrder?.status] || statusConfig[OrderStatus.AWAITING_CONFIRMATION];

  const currentStepIndex = useMemo(() => {
    if (!activeOrder) return -1;
    if (activeOrder.status === OrderStatus.REJECTED) return -1;
    return timelineSteps.findIndex(s => s.status === activeOrder.status);
  }, [activeOrder]);

  const getStatusTime = (status: OrderStatus) => {
    if (!activeOrder) return '';
    const item = [...activeOrder.trackingHistory].reverse().find(h => h.status === status);
    return item ? new Date(item.time).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  };

  const getEtaMinutes = () => {
    if (!activeOrder) return 0;
    const created = new Date(activeOrder.createdAt);
    const now = new Date();
    return Math.max(0, Math.round((now.getTime() - created.getTime()) / 60000));
  };

  const getEtaLabel = () => {
    const mins = getEtaMinutes();
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
  };

  const canShowMap = activeOrder?.partner?.coordinates && activeOrder?.clientDetails?.coordinates;
  const canChat = activeOrder && activeOrder.status !== OrderStatus.COMPLETED && activeOrder.status !== OrderStatus.REJECTED;
  const isLive = activeOrder && [OrderStatus.PICKUP, OrderStatus.DELIVERY].includes(activeOrder.status);
  const isSearching = activeOrder && [OrderStatus.AWAITING_CONFIRMATION, OrderStatus.CONFIRMED, OrderStatus.READY_FOR_PICKUP].includes(activeOrder.status);
  const canModify = activeOrder && [OrderStatus.AWAITING_CONFIRMATION, OrderStatus.CONFIRMED].includes(activeOrder.status);

  const originalPrice = activeOrder
    ? activeOrder.totalPrice + (activeOrder.discountAmount || 0) + (activeOrder.pointsDiscount || 0) + (activeOrder.referralDiscount || 0)
    : 0;
  const deliveryFee = 2.0;
  const totalDiscount = (activeOrder?.discountAmount || 0) + (activeOrder?.pointsDiscount || 0) + (activeOrder?.referralDiscount || 0);

  const getEstimatedDeliveryTime = () => {
    if (!activeOrder) return '';
    const created = new Date(activeOrder.createdAt);
    const delivery = new Date(created.getTime() + 4.5 * 60 * 60 * 1000);
    return `Aujourd'hui avant ${delivery.getHours()}h${delivery.getMinutes().toString().padStart(2, '0')}`;
  };

  const getTotalTimeRemaining = () => {
    if (!activeOrder) return '';
    const elapsed = getEtaMinutes();
    const totalEstimated = 270;
    const remaining = Math.max(0, totalEstimated - elapsed);
    if (remaining < 60) return `${remaining} min`;
    const h = Math.floor(remaining / 60);
    const m = remaining % 60;
    return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
  };

  const articleList = useMemo(() => {
    if (!activeOrder) return [];
    const list: { name: string; quantity: number; price: number }[] = [];
    activeOrder.serviceItems.forEach(si => {
      si.items?.forEach(item => {
        list.push({ name: item.article.name, quantity: item.quantity, price: item.article.price });
      });
    });
    return list;
  }, [activeOrder]);

  const articleCount = useMemo(() => {
    if (!activeOrder) return 0;
    return activeOrder.serviceItems.reduce((sum, si) => {
      if (si.items) return sum + si.items.reduce((s, item) => s + item.quantity, 0);
      return sum;
    }, 0);
  }, [activeOrder]);

  if (!activeOrder) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-slate-800 rounded-2xl shadow-card p-8 max-w-md w-full">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="shoppingBag" className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucune commande active</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Passez une commande pour la suivre en temps réel.</p>
          <button onClick={() => setCurrentPage({ name: 'order' })} className="w-full bg-brand-blue hover:bg-brand-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
            Passer une commande
          </button>
        </div>
      </div>
    );
  }

  if (activeOrder.status === OrderStatus.REJECTED) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-slate-800 rounded-2xl shadow-card p-8 max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="xmark" className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Commande annulée</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-mono">ID: {activeOrder.backendOrderNumber || activeOrder.id}</p>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-left mb-6">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Raison</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{activeOrder.rejectionReason || 'Aucune raison spécifiée'}</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-2">Aucun frais ne vous sera facturé.</p>
          </div>
          <button onClick={() => { resetOrderDraft(); setActiveOrder(null); setCurrentPage({ name: 'order' }); }} className="w-full bg-brand-blue hover:bg-brand-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
            Nouvelle commande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* ─── HERO STATUS BANNER ─── */}
        <div className={`${config.bgColor} border ${config.borderColor} rounded-2xl p-5 sm:p-6 mb-5`}>
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl ${isLive ? 'bg-brand-blue' : 'bg-white dark:bg-slate-800'} flex items-center justify-center shrink-0 ${isLive ? 'animate-pulse' : ''}`}>
              <Icon name={config.icon as any} className={`w-7 h-7 ${isLive ? 'text-white' : config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`text-xl sm:text-2xl font-bold ${config.color}`}>{config.label}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {activeOrder.partner && <span className="font-semibold">{activeOrder.partner.name}</span>} — {config.heroMessage}
              </p>
              {isLive && (
                <p className="text-sm font-semibold text-brand-blue mt-2">
                  Arrivée estimée : {getEtaLabel()} — Livraison estimée : {getEstimatedDeliveryTime()}
                </p>
              )}
              {!isLive && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Livraison estimée : <strong className="text-gray-900 dark:text-white">{getEstimatedDeliveryTime()}</strong> — Temps restant : <strong className="text-gray-900 dark:text-white">{getTotalTimeRemaining()}</strong>
                </p>
              )}
              {isSearching && (
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Temps moyen : <strong className="text-gray-900 dark:text-white">2 min</strong></span>
                  <span className="text-gray-600 dark:text-gray-300">Livreurs disponibles : <strong className="text-green-600">4</strong></span>
                </div>
              )}
            </div>
            {isLive && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-brand-blue bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-brand-blue/20 shrink-0">
                <span className="w-2 h-2 bg-brand-blue rounded-full animate-pulse" />
                EN DIRECT
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Progression</span>
              <span className={`text-xs font-bold ${config.color}`}>{config.progress}%</span>
            </div>
            <div className="w-full h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-blue rounded-full transition-all duration-700 ease-out"
                style={{ width: `${config.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* ─── QUICK KPIs ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Commande', value: activeOrder.backendOrderNumber || activeOrder.id.slice(0, 12), icon: 'document-text' as const },
            { label: 'Statut', value: config.label, icon: 'badge-check' as const, color: config.color },
            { label: 'Montant', value: formatPrice(activeOrder.totalPrice), icon: 'currencyDollar' as const },
            { label: 'Collecte', value: activeOrder.pickupTime || '—', icon: 'calendar' as const },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon name={kpi.icon} className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{kpi.label}</span>
              </div>
              <p className={`text-sm font-bold truncate ${kpi.color || 'text-gray-900 dark:text-white'}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* ─── HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Suivi de votre commande</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="font-mono">ID : {activeOrder.backendOrderNumber || activeOrder.id}</span>
              <span>•</span>
              <span>Passée le {new Date(activeOrder.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          {canChat && (
            <button onClick={() => setIsChatOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-xl text-sm font-semibold hover:bg-brand-blue-700 transition-colors self-start">
              <Icon name="chatBubble" className="w-4 h-4" />
              Contacter
            </button>
          )}
        </div>

        {/* ─── MAIN GRID ─── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Column */}
          <div className="w-full lg:w-[60%] space-y-6">

            {/* Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
              <div className="space-y-0">
                {timelineSteps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const time = getStatusTime(step.status);

                  return (
                    <div key={step.status} className="flex gap-3 sm:gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isCompleted ? 'bg-brand-blue text-white'
                          : isCurrent ? 'bg-brand-blue text-white ring-4 ring-brand-blue/20'
                          : 'bg-gray-200 dark:bg-slate-700 text-gray-400'
                        }`}>
                          {isCompleted ? <Icon name="check" className="w-4 h-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                        </div>
                        {index < timelineSteps.length - 1 && (
                          <div className={`w-0.5 flex-1 min-h-[28px] ${isCompleted ? 'bg-brand-blue' : 'bg-gray-200 dark:bg-slate-700'}`} />
                        )}
                      </div>
                      <div className={`pb-5 ${index === timelineSteps.length - 1 ? 'pb-0' : ''} flex-1`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${isCompleted || isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                              {step.label}
                            </p>
                            {isCompleted && time && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{time}</p>
                            )}
                            {isCurrent && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.description}</p>
                            )}
                          {!isCompleted && !isCurrent && (
                            <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{step.description}</p>
                          )}
                        </div>
                        {isCurrent && isLive && (
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">ETA</span>
                            <p className="text-lg font-bold text-brand-blue">{getEtaLabel()}</p>
                          </div>
                        )}
                        {!isCompleted && !isCurrent && index > currentStepIndex && (
                          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                            {step.etaLabel}
                          </span>
                        )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Map or Pickup Info */}
            {canShowMap ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 overflow-hidden relative">
                <OrderTrackingMap order={activeOrder} />
                <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 shadow">
                  <span>Mise à jour il y a 2 min</span>
                  <Icon name="arrow-path" className="w-3 h-3" />
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 overflow-hidden">
                {/* Static Map */}
                <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-30">
                    <svg viewBox="0 0 400 200" className="w-full h-full">
                      <line x1="0" y1="50" x2="400" y2="50" stroke="#94a3b8" strokeWidth="0.5" />
                      <line x1="0" y1="100" x2="400" y2="100" stroke="#94a3b8" strokeWidth="0.5" />
                      <line x1="0" y1="150" x2="400" y2="150" stroke="#94a3b8" strokeWidth="0.5" />
                      <line x1="100" y1="0" x2="100" y2="200" stroke="#94a3b8" strokeWidth="0.5" />
                      <line x1="200" y1="0" x2="200" y2="200" stroke="#94a3b8" strokeWidth="0.5" />
                      <line x1="300" y1="0" x2="300" y2="200" stroke="#94a3b8" strokeWidth="0.5" />
                      <line x1="50" y1="30" x2="350" y2="80" stroke="#cbd5e1" strokeWidth="1" />
                      <line x1="80" y1="120" x2="320" y2="60" stroke="#cbd5e1" strokeWidth="1" />
                    </svg>
                  </div>
                  <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 bg-brand-blue rounded-full flex items-center justify-center shadow-lg">
                      <Icon name="mapPin" className="w-4 h-4 text-white" />
                    </div>
                    <div className="w-3 h-3 bg-brand-blue rounded-full mx-auto mt-0.5 animate-ping opacity-75" />
                  </div>
                  {activeOrder.partner?.coordinates && (
                    <div className="absolute top-1/3 right-1/3 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        <Icon name="building" className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs shadow">
                    <p className="font-semibold text-gray-900 dark:text-white">📍 {activeOrder.clientDetails?.name || 'Votre adresse'}</p>
                    <p className="text-gray-500 dark:text-gray-400">{activeOrder.clientDetails?.pickupAddress ? formatAddress(activeOrder.clientDetails.pickupAddress) : 'Kinshasa'}</p>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Ramassage prévu</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activeOrder.pickupTime || '—'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Distance</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">4.2 km</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Zone</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{activeOrder.clientDetails?.pickupAddress?.commune || 'Ngaliema'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Livraison estimée</p>
                    <p className="text-xs text-brand-blue font-bold">{getEstimatedDeliveryTime()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Proof Block */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="document-text" className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Articles enregistrés ({articleList.length})</h3>
              </div>
              <div className="space-y-2">
                {articleList.map((article, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      currentStepIndex >= 4 ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {currentStepIndex >= 4 && <Icon name="check" className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className={`text-sm ${currentStepIndex >= 4 ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                        {article.quantity}x {article.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatPrice(article.price * article.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {currentStepIndex < 4 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1.5">
                  <Icon name="photo" className="w-3.5 h-3.5" />
                  Photos disponibles après ramassage
                </p>
              ) : (
                <p className="text-xs text-green-600 dark:text-green-400 mt-3 flex items-center gap-1.5 font-semibold">
                  <Icon name="check" className="w-3.5 h-3.5" />
                  {articleList.length} articles vérifiés — Photos enregistrées
                </p>
              )}
            </div>

            {/* Articles Recap */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Récapitulatif de votre commande
              </h3>
              <div className="space-y-3">
                {activeOrder.serviceItems.map((si) =>
                  si.items?.map((item) => (
                    <div key={item.article.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                          <Icon name="shirt" className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.quantity}x {item.article.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatPrice(item.article.price)} unité</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(item.article.price * item.quantity)}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Sous-total</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(originalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Frais de livraison</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(deliveryFee)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Réductions {activeOrder.appliedPromoCode && `(${activeOrder.appliedPromoCode})`}</span>
                    <span className="font-semibold text-green-600">-{formatPrice(totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100 dark:border-slate-700">
                  <span className="text-gray-900 dark:text-white">Total payé</span>
                  <span className="text-brand-blue">{formatPrice(activeOrder.totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-[40%] space-y-6">

            {/* Driver Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Votre chauffeur</h3>
                {isLive && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Arrivée estimée</span>
                    <p className="text-xl font-bold text-brand-blue">{getEtaLabel()}</p>
                  </div>
                )}
                {isSearching && !driver && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    Recherche...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 overflow-hidden ${driver ? 'bg-gradient-to-br from-brand-blue to-[#00B4D8] ring-2 ring-green-400' : 'bg-gray-200 dark:bg-slate-700'}`}>
                    {driver ? (driver.name?.charAt(0) || 'C') : '?'}
                  </div>
                  {driver && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div className="min-w-0 flex-1">
                  {driver ? (
                    <>
                      <p className="font-bold text-gray-900 dark:text-white">{driver.name}</p>
                      <div className="flex items-center gap-1">
                        <Icon name="star" className="w-3 h-3 text-amber-400" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">4.9</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">(124 avis)</span>
                      </div>
                      {driver.vehicleInfo && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Moto • {driver.vehicleInfo}</p>
                      )}
                    </>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Recherche d'un chauffeur</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Temps moyen : <strong className="text-gray-700 dark:text-gray-300">2 min</strong></p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400"><strong className="text-green-600">5</strong> disponibles</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Dernière attribution : <strong className="text-gray-700 dark:text-gray-300">il y a 35s</strong></span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '97%' }} />
                        </div>
                        <span className="text-[10px] font-bold text-green-600">97%</span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Probabilité de ramassage dans les délais</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <a href={`tel:${driver?.phone || ''}`} className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${driver ? 'bg-brand-blue text-white hover:bg-brand-blue-700' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed'}`}>
                  <Icon name="phone" className="w-4 h-4" />
                  Appeler
                </a>
                {canChat && (
                  <button onClick={() => setIsChatOpen(true)} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <Icon name="chatBubble" className="w-4 h-4" />
                    Contacter
                  </button>
                )}
                <button className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  <Icon name="chevron-down" className="w-4 h-4" />
                  Détails
                </button>
              </div>
            </div>

            {/* Partner Card */}
            {activeOrder.partner && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Votre partenaire</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-blue to-[#00B4D8] flex items-center justify-center shrink-0 overflow-hidden">
                    {activeOrder.partner.imageUrls && activeOrder.partner.imageUrls[0] ? (
                      <img src={activeOrder.partner.imageUrls[0]} alt={activeOrder.partner.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-lg">{activeOrder.partner.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{activeOrder.partner.name}</p>
                    <div className="flex items-center gap-1">
                      <Icon name="star" className="w-3 h-3 text-amber-400" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{activeOrder.partner.rating}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({activeOrder.partner.reviewCount} avis)</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Icon name="mapPin" className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Gombe, Kinshasa</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                      <span><strong className="text-gray-700 dark:text-gray-300">523</strong> commandes</span>
                      <span><strong className="text-green-600">98%</strong> à temps</span>
                      <span><strong className="text-gray-700 dark:text-gray-300">2 ans</strong></span>
                    </div>
                    <p className="text-xs text-brand-blue font-semibold mt-0.5">Livraison 24h</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${activeOrder.partner.address}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <Icon name="phone" className="w-4 h-4" />
                    Appeler partenaire
                  </a>
                  {canChat && (
                    <button onClick={() => setIsChatOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <Icon name="chatBubble" className="w-4 h-4" />
                      Chat partenaire
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* History */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="clock-history" className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Historique de votre commande</h3>
              </div>
              <div className="space-y-3">
                {(showFullHistory ? activeOrder.trackingHistory : activeOrder.trackingHistory.slice(-5).reverse()).map((entry, i) => {
                  const time = new Date(entry.time);
                  const label = statusConfig[entry.status]?.label || entry.status;
                  const isLatest = i === 0;
                  return (
                    <div key={i} className={`flex items-start gap-3 ${isLatest ? 'bg-blue-50 dark:bg-blue-900/10 -mx-2 px-2 py-1.5 rounded-lg' : ''}`}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isLatest ? 'bg-brand-blue' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <p className={`text-sm font-medium ${isLatest ? 'text-brand-blue' : 'text-gray-900 dark:text-white'}`}>
                            {label}
                          </p>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 ml-9">
                          {time.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {activeOrder.trackingHistory.length > 5 && (
                <button onClick={() => setShowFullHistory(!showFullHistory)} className="mt-3 text-sm font-semibold text-brand-blue hover:text-brand-blue-700 transition-colors">
                  {showFullHistory ? 'Voir moins' : 'Voir tout l\'historique'}
                </button>
              )}
            </div>

            {/* Notification Preferences */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Recevoir les mises à jour</h3>
              <div className="space-y-2">
                {notificationPrefs.map((pref) => (
                  <label key={pref.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      notifPrefs[pref.id as keyof typeof notifPrefs]
                        ? 'bg-brand-blue border-brand-blue'
                        : 'border-gray-300 dark:border-gray-600 group-hover:border-brand-blue/50'
                    }`}>
                      {notifPrefs[pref.id as keyof typeof notifPrefs] && <Icon name="check" className="w-3 h-3 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={notifPrefs[pref.id as keyof typeof notifPrefs]}
                      onChange={(e) => setNotifPrefs(prev => ({ ...prev, [pref.id]: e.target.checked }))}
                    />
                    <Icon name={pref.icon} className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{pref.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── TRUST BADGES ─── */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Insurance */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="shield" className="w-4 h-4 text-brand-blue" />
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase">Couverture</h4>
              </div>
              <div className="space-y-1">
                {['Perte d\'articles', 'Dommage pendant traitement', 'Erreur de livraison'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Icon name="check" className="w-3 h-3 text-green-500 shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Support */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="lifebuoy" className="w-4 h-4 text-brand-blue" />
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase">Support</h4>
              </div>
              <div className="space-y-1">
                {['Disponible 24/7', 'Réponse < 5 min', 'Chat, téléphone, email'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Icon name="check" className="w-3 h-3 text-green-500 shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Payment */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="shield-check" className="w-4 h-4 text-brand-blue" />
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase">Paiement</h4>
              </div>
              <div className="space-y-1">
                {['Transactions 100% sécurisées', 'Pas de frais cachés', 'Satisfait ou remboursé'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Icon name="check" className="w-3 h-3 text-green-500 shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── BOTTOM ACTIONS ─── */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {canModify && (
            <>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <Icon name="calendar" className="w-4 h-4" />
                Modifier créneau
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <Icon name="pencil" className="w-4 h-4" />
                Modifier instructions
              </button>
            </>
          )}
          <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <Icon name="arrow-down-tray" className="w-4 h-4" />
            Télécharger facture
          </button>
          {activeOrder.status !== OrderStatus.COMPLETED && (
            <button
              onClick={() => { if (confirm('Voulez-vous vraiment annuler cette commande ?')) { setActiveOrder(null); setCurrentPage({ name: 'home' }); } }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 dark:border-red-800 text-red-600 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Icon name="xmark" className="w-4 h-4" />
              Annuler la commande
            </button>
          )}
          <div className="flex-1 flex items-center justify-center gap-3 py-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Icon name="question-mark-circle" className="w-4 h-4" />
              Besoin d'aide ?
            </span>
            <a href="tel:+243812345678" className="flex items-center gap-1.5 font-semibold text-brand-blue">
              <Icon name="phone" className="w-3.5 h-3.5" />
              +243 81 234 5678
            </a>
          </div>
        </div>

        {/* ─── REVIEW PROMPT ─── */}
        {activeOrder.status === OrderStatus.COMPLETED && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 sm:p-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-green-800 dark:text-green-300">Commande livrée !</h3>
              {activeOrder.pointsEarned && activeOrder.pointsEarned > 0 && (
                <div className="mt-2 inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/40 px-4 py-2 rounded-full">
                  <Icon name="gift" className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">+{activeOrder.pointsEarned} points gagnés</span>
                </div>
              )}
              {!hasSubmittedReview && (
                <>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-3">Comment était votre expérience ?</p>
                  <div className="mt-4 flex gap-3 justify-center">
                    <button onClick={() => { setActiveOrder(null); setCurrentPage({ name: 'home' }); }} className="px-5 py-2.5 rounded-xl border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 font-semibold text-sm hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                      Plus tard
                    </button>
                    <button onClick={() => setIsReviewModalOpen(true)} className="px-5 py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue-700 transition-colors">
                      Laisser un avis
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onSubmit={handleSubmitReview} order={activeOrder} />
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} order={activeOrder} />
    </div>
  );
};
