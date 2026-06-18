import React from 'react';
import { Icon } from '../Icon';
import { DeliveryTimeline, type DeliveryStep } from '../ui/DeliveryTimeline';
import { StatusChip } from '../ui/StatusChip';
import { CARD, TYPO, SPACING, STATUS_COLORS, type StatusTone } from '../ui/tokens';

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

interface ClientTrackingHeroProps {
  status: OrderStatus;
  partnerName?: string;
  eta?: string;
  estimatedDelivery?: string;
  orderRef: string;
  progressPct: number;
}

const STATUS_CONFIG: Record<string, { label: string; message: string; tone: StatusTone; icon: string }> = {
  AWAITING_CONFIRMATION: { label: 'Commande reçue', message: 'En attente de confirmation.', tone: 'warning', icon: 'clock' },
  CONFIRMED: { label: 'Confirmée', message: 'Le partenaire a accepté.', tone: 'info', icon: 'check' },
  READY_FOR_PICKUP: { label: 'Chauffeur assigné', message: 'En route pour récupérer.', tone: 'info', icon: 'user' },
  PICKUP: { label: 'Chauffeur en route', message: 'Il arrive chez vous.', tone: 'info', icon: 'truck' },
  PROCESSING: { label: 'En traitement', message: 'Nettoyage en cours.', tone: 'info', icon: 'sparkles' },
  READY_FOR_DELIVERY: { label: 'Prêt', message: 'Vérification terminée.', tone: 'success', icon: 'check' },
  DELIVERY: { label: 'En livraison', message: 'Le livreur arrive.', tone: 'info', icon: 'truck' },
  COMPLETED: { label: 'Livrée', message: 'Terminée avec succès.', tone: 'success', icon: 'check' },
  REJECTED: { label: 'Annulée', message: 'Commande annulée.', tone: 'danger', icon: 'xmark' },
  DELAYED: { label: 'En retard', message: 'Un retard a été signalé.', tone: 'warning', icon: 'warning' },
};

const TIMELINE_STEPS: { status: string; label: string }[] = [
  { status: 'AWAITING_CONFIRMATION', label: 'Reçue' },
  { status: 'CONFIRMED', label: 'Confirmée' },
  { status: 'PICKUP', label: 'Ramassage' },
  { status: 'PROCESSING', label: 'Traitement' },
  { status: 'DELIVERY', label: 'Livraison' },
  { status: 'COMPLETED', label: 'Livrée' },
];

const getStepIndex = (status: OrderStatus): number =>
  TIMELINE_STEPS.findIndex((s) => s.status === status);

export const ClientTrackingHero: React.FC<ClientTrackingHeroProps> = ({
  status,
  partnerName,
  eta,
  estimatedDelivery,
  orderRef,
  progressPct,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.AWAITING_CONFIRMATION;
  const colors = STATUS_COLORS[config.tone];
  const currentIdx = getStepIndex(status);
  const isLive = ['PICKUP', 'DELIVERY'].includes(status);
  const isRejected = status === 'REJECTED';

  const steps: DeliveryStep[] = TIMELINE_STEPS.map((step, i) => ({
    id: step.status.toLowerCase(),
    label: step.label,
    completed: i < currentIdx,
    current: i === currentIdx,
  }));

  return (
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
              {partnerName && <span className="font-semibold">{partnerName}</span>} — {config.message}
            </p>
            {eta && isLive && (
              <p className="mt-1.5 text-sm font-bold text-brand-blue">Arrivée: {eta}</p>
            )}
            {estimatedDelivery && !isLive && !isRejected && (
              <p className="mt-1.5 text-xs text-content-muted">
                Livraison estimée: <strong className="text-content-primary">{estimatedDelivery}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={`${SPACING.cardPad}`}>
        <DeliveryTimeline steps={steps} compact />
      </div>

      <div className="px-4 pb-4">
        <p className="font-mono text-[10px] text-content-muted">ID: {orderRef}</p>
      </div>
    </div>
  );
};

export default ClientTrackingHero;
