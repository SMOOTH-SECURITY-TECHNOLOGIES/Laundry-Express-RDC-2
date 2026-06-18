import React, { useState } from 'react';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { MobileButton } from '../ui/MobileButton';
import { DeliveryTimeline, type DeliveryStep } from '../ui/DeliveryTimeline';
import { CARD, TYPO, SPACING, STATUS_COLORS, type StatusTone } from '../ui/tokens';
import { BottomSheet } from '../ui/BottomSheet';

/* ─── Types ─── */
type OrderStatus =
  | 'AWAITING_CONFIRMATION'
  | 'CONFIRMED'
  | 'READY_FOR_PICKUP'
  | 'PICKUP'
  | 'PROCESSING'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERY'
  | 'COMPLETED'
  | 'REJECTED'
  | 'DELAYED';

export interface ClientOrder {
  id: string;
  orderRef: string;
  status: OrderStatus;
  statusLabel: string;
  partnerName: string;
  partnerPhone?: string;
  driverName?: string;
  driverPhone?: string;
  driverInitial?: string;
  pickupAddress: string;
  deliveryAddress: string;
  articles: { name: string; quantity: number; price: number }[];
  totalPrice: string;
  eta?: string;
  estimatedDelivery?: string;
  createdAt: string;
}

interface ClientMobileDashboardProps {
  order: ClientOrder | null;
  onCallPartner: () => void;
  onCallDriver: () => void;
  onChat: () => void;
  onNewOrder: () => void;
  onShareTracking: () => void;
  onContactSupport: () => void;
  onRateOrder?: (rating: number, comment: string) => void;
  hasRated?: boolean;
}

/* ─── Config ─── */
const STATUS_CONFIG: Record<string, { label: string; message: string; tone: StatusTone; icon: string }> = {
  AWAITING_CONFIRMATION: { label: 'En attente', message: 'Le partenaire doit confirmer.', tone: 'warning', icon: 'clock' },
  CONFIRMED: { label: 'Confirmée', message: 'Le partenaire a accepté.', tone: 'info', icon: 'check' },
  READY_FOR_PICKUP: { label: 'Chauffeur assigné', message: 'En route pour récupérer.', tone: 'info', icon: 'user' },
  PICKUP: { label: 'En collecte', message: 'Le chauffeur arrive.', tone: 'info', icon: 'truck' },
  PROCESSING: { label: 'En traitement', message: 'Nettoyage en cours.', tone: 'info', icon: 'sparkles' },
  READY_FOR_DELIVERY: { label: 'Prêt', message: 'Vérification terminée.', tone: 'success', icon: 'check' },
  DELIVERY: { label: 'En livraison', message: 'Le livreur arrive.', tone: 'info', icon: 'truck' },
  COMPLETED: { label: 'Livrée', message: 'Terminée avec succès.', tone: 'success', icon: 'check' },
  REJECTED: { label: 'Annulée', message: 'Commande annulée.', tone: 'danger', icon: 'xmark' },
  DELAYED: { label: 'En retard', message: 'Un retard a été signalé.', tone: 'warning', icon: 'warning' },
};

const TIMELINE_STEPS = [
  { status: 'AWAITING_CONFIRMATION', label: 'Reçue' },
  { status: 'CONFIRMED', label: 'Confirmée' },
  { status: 'PICKUP', label: 'Ramassage' },
  { status: 'PROCESSING', label: 'Traitement' },
  { status: 'DELIVERY', label: 'Livraison' },
  { status: 'COMPLETED', label: 'Livrée' },
];

const getStepIndex = (status: OrderStatus): number =>
  TIMELINE_STEPS.findIndex((s) => s.status === status);

/* ─── Main Component ─── */
export const ClientMobileDashboard: React.FC<ClientMobileDashboardProps> = ({
  order,
  onCallPartner,
  onCallDriver,
  onChat,
  onNewOrder,
  onShareTracking,
  onContactSupport,
  onRateOrder,
  hasRated = false,
}) => {
  const [showArticles, setShowArticles] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [showRatingSheet, setShowRatingSheet] = useState(false);

  if (!order) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
        <div className={`${CARD.base} p-6 text-center max-w-sm w-full`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-brand-blue">
            <Icon name="shoppingBag" className="h-8 w-8" />
          </div>
          <h2 className={`mt-4 ${TYPO.pageTitle}`}>Aucune commande active</h2>
          <p className={`mt-2 ${TYPO.sectionSubtitle}`}>Passez une commande pour la suivre.</p>
          <div className="mt-4">
            <MobileButton label="Commander" icon="plus" variant="primary" size="lg" onClick={onNewOrder} />
          </div>
        </div>
      </div>
    );
  }

  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.AWAITING_CONFIRMATION;
  const colors = STATUS_COLORS[config.tone];
  const currentIdx = getStepIndex(order.status);
  const isLive = ['PICKUP', 'DELIVERY'].includes(order.status);
  const isCompleted = order.status === 'COMPLETED';

  const steps: DeliveryStep[] = TIMELINE_STEPS.map((step, i) => ({
    id: step.status.toLowerCase(),
    label: step.label,
    completed: i < currentIdx,
    current: i === currentIdx,
  }));

  return (
    <div className="min-h-screen bg-surface-page pb-24">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b border-surface-border bg-surface-card/95 backdrop-blur safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className={TYPO.pageTitle}>Suivi commande</h1>
            <p className="font-mono text-[10px] text-content-muted">ID: {order.orderRef}</p>
          </div>
          <MobileButton
            label=""
            icon="share"
            variant="secondary"
            size="sm"
            fullWidth={false}
            onClick={onShareTracking}
          />
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4">
        {/* ─── Hero Status ─── */}
        <div className={`${CARD.base} overflow-hidden`}>
          <div className={`${SPACING.cardPad} border-b border-surface-border-subtle`}>
            <div className="flex items-start gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  isLive ? `${colors.bgSolid} animate-pulse` : colors.bg
                }`}
              >
                <Icon
                  name={config.icon as any}
                  className={`h-6 w-6 ${isLive ? colors.textSolid : colors.text}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className={`text-lg font-black ${colors.text}`}>{config.label}</h2>
                  {isLive && (
                    <StatusChip label="LIVE" tone="info" pulse size="xs" variant="filled" />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-content-muted">
                  <span className="font-semibold">{order.partnerName}</span> — {config.message}
                </p>
                {order.eta && isLive && (
                  <p className="mt-1.5 text-sm font-bold text-brand-blue">Arrivée: {order.eta}</p>
                )}
                {order.estimatedDelivery && !isLive && !isCompleted && (
                  <p className="mt-1.5 text-xs text-content-muted">
                    Livraison estimée: <strong className="text-content-primary">{order.estimatedDelivery}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={`${SPACING.cardPad}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-content-muted">Progression</span>
              <span className={`text-[10px] font-black ${colors.text}`}>
                {Math.round(((currentIdx + 1) / TIMELINE_STEPS.length) * 100)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-brand-blue transition-all duration-700"
                style={{ width: `${((currentIdx + 1) / TIMELINE_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* ─── Timeline ─── */}
        <div className={`${CARD.base} p-4`}>
          <DeliveryTimeline steps={steps} />
        </div>

        {/* ─── Actions rapides ─── */}
        <div className="grid grid-cols-2 gap-2">
          {order.driverPhone && (
            <MobileButton
              label="Appeler chauffeur"
              icon="phone"
              variant="secondary"
              size="sm"
              onClick={onCallDriver}
            />
          )}
          <MobileButton
            label="Contacter"
            icon="chatBubble"
            variant="primary"
            size="sm"
            onClick={onChat}
          />
          <MobileButton
            label="Support"
            icon="lifebuoy"
            variant="secondary"
            size="sm"
            onClick={onContactSupport}
          />
          {order.partnerPhone && (
            <MobileButton
              label="Appeler partenaire"
              icon="phone"
              variant="secondary"
              size="sm"
              onClick={onCallPartner}
            />
          )}
        </div>

        {/* ─── Chauffeur ─── */}
        {order.driverName && (
          <div className={`${CARD.base} p-4`}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-[#00B4D8] text-lg font-bold text-white ring-2 ring-green-400">
                {order.driverInitial || order.driverName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-content-primary">{order.driverName}</p>
                <div className="flex items-center gap-1">
                  <Icon name="star" className="h-3 w-3 text-amber-400" />
                  <span className="text-xs text-content-muted">Chauffeur assigné</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onCallDriver}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700"
              >
                <Icon name="phone" className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── Articles ─── */}
        <div className={`${CARD.base} overflow-hidden`}>
          <button
            type="button"
            onClick={() => setShowArticles(!showArticles)}
            className={`${SPACING.cardPad} flex w-full items-center justify-between text-left`}
          >
            <div className="flex items-center gap-2">
              <Icon name="document-text" className="h-4 w-4 text-content-muted" />
              <span className="text-sm font-bold text-content-primary">
                Articles ({order.articles.length})
              </span>
            </div>
            <Icon
              name={showArticles ? 'chevron-up' : 'chevron-down'}
              className="h-4 w-4 text-content-muted"
            />
          </button>
          {showArticles && (
            <div className="border-t border-surface-border-subtle px-4 pb-4 space-y-2">
              {order.articles.map((article, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2">
                  <span className="text-sm text-content-primary">{article.quantity}x {article.name}</span>
                  <span className="text-xs text-content-muted">{order.totalPrice}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Détails commande ─── */}
        <div className={`${CARD.base} p-4 space-y-2`}>
          {[
            ['Statut', config.label],
            ['Partenaire', order.partnerName],
            ['Pickup', order.pickupAddress],
            ['Livraison', order.deliveryAddress],
            ['Total', order.totalPrice],
            ['Passée le', order.createdAt],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2">
              <span className="text-xs text-content-muted">{label}</span>
              <span className="text-sm font-black text-content-primary">{value}</span>
            </div>
          ))}
        </div>

        {/* ─── Rating (after delivery) ─── */}
        {isCompleted && !hasRated && (
          <div className={`${CARD.base} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="star" className="h-5 w-5 text-amber-400" />
              <h3 className={TYPO.sectionTitle}>Noter votre expérience</h3>
            </div>
            <p className={`${TYPO.sectionSubtitle} mb-4`}>Votre avis nous aide à améliorer le service.</p>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setRating(star);
                    setShowRatingSheet(true);
                  }}
                  className="transition-transform active:scale-110"
                >
                  <Icon
                    name="star"
                    className={`h-10 w-10 ${
                      star <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className="text-center text-sm font-bold text-content-primary">
                {rating === 1 && 'Mauvais'}
                {rating === 2 && 'Passable'}
                {rating === 3 && 'Correct'}
                {rating === 4 && 'Bien'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>
        )}

        {/* ─── Already rated ─── */}
        {isCompleted && hasRated && (
          <div className={`${CARD.base} p-4 text-center`}>
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Icon name="check" className="h-5 w-5" />
              <span className="text-sm font-bold">Merci pour votre avis !</span>
            </div>
          </div>
        )}

        {/* ─── Bottom CTA ─── */}
        {isCompleted && (
          <MobileButton
            label="Nouvelle commande"
            icon="plus"
            variant="primary"
            size="lg"
            onClick={onNewOrder}
          />
        )}
      </div>

      {/* ─── Rating Sheet ─── */}
      <BottomSheet
        isOpen={showRatingSheet}
        onClose={() => setShowRatingSheet(false)}
        title="Noter votre commande"
      >
        <div className="space-y-4">
          {/* Stars preview */}
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                name="star"
                className={`h-8 w-8 ${
                  star <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            ))}
          </div>

          <p className="text-center text-sm font-bold text-content-primary">
            {rating === 1 && 'Mauvais'}
            {rating === 2 && 'Passable'}
            {rating === 3 && 'Correct'}
            {rating === 4 && 'Bien'}
            {rating === 5 && 'Excellent'}
          </p>

          {/* Comment */}
          <div>
            <label className="text-[10px] font-bold text-content-muted">Commentaire (optionnel)</label>
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Décrivez votre expérience..."
              rows={3}
              className="mt-1 w-full rounded-xl border border-surface-border bg-surface-muted px-4 py-3 text-sm text-content-primary placeholder:text-content-muted focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>

          {/* Submit */}
          <MobileButton
            label="Envoyer mon avis"
            icon="check"
            variant="primary"
            size="lg"
            onClick={() => {
              onRateOrder?.(rating, ratingComment);
              setShowRatingSheet(false);
              setRating(0);
              setRatingComment('');
            }}
          />
        </div>
      </BottomSheet>
    </div>
  );
};

export default ClientMobileDashboard;
