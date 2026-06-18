import React from 'react';
import { Icon } from '../Icon';
import { MobileButton } from '../ui/MobileButton';
import { CARD, TYPO, SPACING, TOUCH } from '../ui/tokens';

interface ClientDriverCardProps {
  driverName?: string;
  driverInitial?: string;
  rating?: number;
  reviewCount?: number;
  vehicleInfo?: string;
  isSearching?: boolean;
  eta?: string;
  onCall: () => void;
  onChat: () => void;
}

export const ClientDriverCard: React.FC<ClientDriverCardProps> = ({
  driverName,
  driverInitial = '?',
  rating = 4.9,
  reviewCount = 124,
  vehicleInfo,
  isSearching = false,
  eta,
  onCall,
  onChat,
}) => (
  <div className={`${CARD.base} overflow-hidden`}>
    {/* Header */}
    <div className={`${SPACING.cardPad} border-b border-surface-border-subtle`}>
      <div className="flex items-center justify-between">
        <h3 className={TYPO.sectionTitle}>Votre chauffeur</h3>
        {eta && !isSearching && (
          <div className="text-right">
            <span className={TYPO.label}>ETA</span>
            <p className="text-lg font-black text-brand-blue">{eta}</p>
          </div>
        )}
        {isSearching && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            Recherche...
          </span>
        )}
      </div>
    </div>

    <div className={`${SPACING.cardPad}`}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full ${
            driverName
              ? 'bg-gradient-to-br from-brand-blue to-[#00B4D8] ring-2 ring-green-400'
              : 'bg-surface-muted'
          }`}
        >
          <span className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
            {driverInitial}
          </span>
          {driverName && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {driverName ? (
            <>
              <p className="truncate text-sm font-bold text-content-primary">{driverName}</p>
              <div className="flex items-center gap-1">
                <Icon name="star" className="h-3 w-3 text-amber-400" />
                <span className="text-xs font-semibold text-content-primary">{rating}</span>
                <span className="text-xs text-content-muted">({reviewCount})</span>
              </div>
              {vehicleInfo && (
                <p className="text-[10px] text-content-muted">Moto · {vehicleInfo}</p>
              )}
            </>
          ) : (
            <p className="text-xs text-content-muted">En recherche de chauffeur...</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MobileButton
          label="Appeler"
          icon="phone"
          variant={driverName ? 'primary' : 'secondary'}
          size="sm"
          disabled={!driverName}
          onClick={onCall}
        />
        <MobileButton
          label="Contacter"
          icon="chatBubble"
          variant="secondary"
          size="sm"
          disabled={!driverName}
          onClick={onChat}
        />
      </div>
    </div>
  </div>
);

export default ClientDriverCard;
