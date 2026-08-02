import React from 'react';
import { Icon } from '../../components/Icon';
import type { DispatchBacklogItem } from '../../lib/logistics/backlog-model';

const PRIORITY_TONE: Record<DispatchBacklogItem['priorite'], string> = {
  Critique: 'bg-red-100 text-red-700',
  'Collecte urgente': 'bg-orange-100 text-orange-700',
  'Livraison critique': 'bg-amber-100 text-amber-800',
  Retard: 'bg-orange-100 text-orange-700',
  Standard: 'bg-surface-muted text-content-muted',
};

const TYPE_LABEL: Record<DispatchBacklogItem['type'], string> = {
  pickup: 'Collecte',
  delivery: 'Livraison',
};

interface BacklogBoardProps {
  missions: DispatchBacklogItem[];
  selectedMissionId?: string | null;
  onMissionClick?: (missionId: string) => void;
  title?: string;
  compact?: boolean;
  maxItems?: number;
}

export const BacklogBoard: React.FC<BacklogBoardProps> = ({
  missions,
  selectedMissionId,
  onMissionClick,
  title = 'Backlog dispatch',
  compact = false,
  maxItems,
}) => {
  const visible = maxItems ? missions.slice(0, maxItems) : missions;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-base font-extrabold leading-tight text-content-primary sm:text-lg">
          <Icon name="shoppingBag" className="h-5 w-5 text-brand-blue" />
          {title}
        </h2>
        <span className="shrink-0 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-extrabold text-brand-blue ring-1 ring-brand-blue/25 dark:bg-brand-blue/20 dark:text-blue-200 dark:ring-blue-400/30">
          {missions.length} mission{missions.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className={`space-y-3 overflow-y-auto pr-1 ${compact ? 'max-h-[360px]' : 'max-h-[420px] sm:max-h-[500px]'}`}>
        {missions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-surface-border-subtle px-4 py-8 text-center text-sm font-medium text-content-muted">
            Aucune mission en attente de dispatch — réseau à jour.
          </p>
        ) : null}
        {visible.map((mission) => {
          const isSelected = selectedMissionId === mission.mission_id;
          return (
            <button
              key={mission.mission_id}
              type="button"
              onClick={() => onMissionClick?.(mission.mission_id)}
              aria-pressed={isSelected}
              className={`w-full rounded-xl border p-3 text-left transition-all sm:p-4 ${
                isSelected
                  ? 'border-brand-blue bg-brand-blue/10 shadow-sm ring-2 ring-brand-blue/20'
                  : 'border-surface-border-subtle bg-surface-muted/40 hover:border-brand-blue/30 hover:shadow-sm'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs font-extrabold text-brand-blue ring-1 ring-brand-blue/25">
                      {TYPE_LABEL[mission.type]}
                    </span>
                    <span className="font-mono text-xs font-bold text-content-muted">{mission.mission_id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${PRIORITY_TONE[mission.priorite]}`}>
                      {mission.priorite}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-content-primary">{mission.client}</p>
                  <p className="mt-1 flex items-start gap-1 text-xs leading-5 text-content-muted">
                    <Icon name="mapPin" className="mt-0.5 h-3 w-3 shrink-0" />
                    <span className="break-words">{mission.adresse} → {mission.delivery}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-content-muted">{mission.commune} · {mission.distance} km · {mission.statut}</p>
                </div>
                <div className="flex items-center justify-between gap-3 text-left sm:block sm:text-right">
                  <p className="text-sm font-extrabold text-content-primary">{mission.montant.toLocaleString('fr-FR')} FC</p>
                  <p className="text-xs font-black text-brand-blue">ETA {mission.eta}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BacklogBoard;
