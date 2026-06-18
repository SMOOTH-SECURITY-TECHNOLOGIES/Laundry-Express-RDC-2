import React from 'react';
import { Icon } from '../Icon';
import { StatusChip } from '../ui/StatusChip';
import { MobileButton } from '../ui/MobileButton';
import { CARD, TYPO, SPACING } from '../ui/tokens';

interface UrgencyMission {
  id: string;
  customerName: string;
  pickupZone: string;
  deliveryZone: string;
  queueMinutes: number;
  priority: 'normal' | 'high' | 'urgent';
  driverName?: string;
  status: string;
}

interface DispatcherMobileUrgencyProps {
  urgentMissions: UrgencyMission[];
  totalPending: number;
  onSelectMission: (id: string) => void;
  onAssignMission: (id: string) => void;
}

export const DispatcherMobileUrgency: React.FC<DispatcherMobileUrgencyProps> = ({
  urgentMissions,
  totalPending,
  onSelectMission,
  onAssignMission,
}) => {
  const [showAll, setShowAll] = React.useState(false);
  const displayMissions = showAll ? urgentMissions : urgentMissions.slice(0, 3);

  return (
    <section className={`${SPACING.sectionGap}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Icon name="warning" className="h-4 w-4" />
          </div>
          <h2 className={TYPO.sectionTitle}>Urgences</h2>
        </div>
        <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-100 px-2 text-[10px] font-black text-red-700">
          {urgentMissions.length}
        </span>
      </div>

      <div className="space-y-2">
        {displayMissions.map((mission) => (
          <article
            key={mission.id}
            className="w-full rounded-2xl border border-red-200/60 bg-red-50/80 p-4 transition dark:border-red-900/40 dark:bg-red-950/20"
          >
            <button
              type="button"
              onClick={() => onSelectMission(mission.id)}
              className="w-full text-left active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-black text-red-700 dark:text-red-300">{mission.id}</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-content-primary">{mission.customerName}</p>
                  <p className="mt-0.5 text-xs text-content-muted">
                    {mission.pickupZone} → {mission.deliveryZone}
                  </p>
                </div>
                <div className="shrink-0 space-y-1 text-right">
                  <StatusChip
                    label={mission.priority === 'urgent' ? 'Urgent' : 'Prioritaire'}
                    tone="danger"
                    pulse
                    size="xs"
                  />
                  <p className="text-xs font-bold text-orange-600">{mission.queueMinutes} min</p>
                </div>
              </div>
            </button>

            {!mission.driverName ? (
              <div className="mt-3">
                <MobileButton
                  label="Assigner un chauffeur"
                  icon="user"
                  variant="danger"
                  size="sm"
                  onClick={() => onAssignMission(mission.id)}
                />
              </div>
            ) : (
              <p className="mt-2 rounded-lg bg-surface-muted px-3 py-1.5 text-xs font-bold text-content-muted">
                Chauffeur: {mission.driverName}
              </p>
            )}
          </article>
        ))}
      </div>

      {urgentMissions.length > 3 && (
        <MobileButton
          label={showAll ? 'Voir moins' : `Voir les ${urgentMissions.length} urgences`}
          icon={showAll ? 'chevron-up' : 'chevron-down'}
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
        />
      )}

      {urgentMissions.length === 0 && (
        <div className="rounded-2xl bg-green-50/80 p-4 text-center dark:bg-green-950/20">
          <Icon name="check" className="mx-auto h-6 w-6 text-green-600" />
          <p className="mt-1 text-sm font-bold text-green-700">Aucune urgence en cours</p>
        </div>
      )}
    </section>
  );
};

export default DispatcherMobileUrgency;
