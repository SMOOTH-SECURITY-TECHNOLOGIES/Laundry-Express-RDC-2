import React from 'react';
import { Icon } from '../Icon';
import { MobileButton } from '../ui/MobileButton';
import { CARD, TYPO, SPACING } from '../ui/tokens';
import type { MissionStep } from './MissionStatusFlow';

interface MissionActionsProps {
  currentStep: MissionStep;
  isUpdating: boolean;
  onAccept?: () => void;
  onStart?: () => void;
  onArrivePickup?: () => void;
  onArriveDelivery?: () => void;
  onComplete?: () => void;
  onIncident?: () => void;
}

/**
 * Actions contextuelles selon l'étape du workflow :
 *   driver_assigned   → Accepter + Incident
 *   accepted          → Démarrer + Incident
 *   in_transit_pickup → Arrivé au pickup + Incident
 *   in_transit_delivery → Marquer livrée + Incident
 *   completed         → (aucune action)
 */
export const MissionActions: React.FC<MissionActionsProps> = ({
  currentStep,
  isUpdating,
  onAccept,
  onStart,
  onArrivePickup,
  onArriveDelivery,
  onComplete,
  onIncident,
}) => {
  if (currentStep === 'completed') {
    return (
      <div className={`${CARD.base} p-4 text-center`}>
        <div className="flex items-center justify-center gap-2 text-green-600">
          <Icon name="check" className="h-5 w-5" />
          <span className="text-sm font-black">Mission terminée</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Action principale */}
      {currentStep === 'driver_assigned' && (
        <MobileButton
          label="Accepter la mission"
          icon="check"
          variant="primary"
          size="lg"
          loading={isUpdating}
          onClick={onAccept}
        />
      )}

      {currentStep === 'accepted' && (
        <MobileButton
          label="Démarrer la collecte"
          icon="play"
          variant="primary"
          size="lg"
          loading={isUpdating}
          onClick={onStart}
        />
      )}

      {currentStep === 'in_transit_pickup' && (
        <MobileButton
          label="Arrivé au pickup"
          icon="mapPin"
          variant="success"
          size="lg"
          loading={isUpdating}
          onClick={onArrivePickup}
        />
      )}

      {currentStep === 'in_transit_delivery' && (
        <MobileButton
          label="Marquer livrée"
          icon="check"
          variant="success"
          size="lg"
          loading={isUpdating}
          onClick={onComplete}
        />
      )}

      {/* Action secondaire : incident */}
      <MobileButton
        label="Signaler un incident"
        icon="warning"
        variant="danger"
        size="md"
        onClick={onIncident}
      />
    </div>
  );
};

export default MissionActions;
