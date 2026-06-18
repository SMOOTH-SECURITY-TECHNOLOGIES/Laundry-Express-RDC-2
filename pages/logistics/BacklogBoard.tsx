import React from 'react';
import { Icon } from '../../components/Icon';

interface BacklogMission {
  id: string;
  client: string;
  pickup: string;
  delivery: string;
  distance: number;
  commune: string;
  amount: number;
  time: string;
}

interface BacklogBoardProps {
  missions: BacklogMission[];
  selectedMissionId?: string | null;
  onMissionClick?: (missionId: string) => void;
}

export const BacklogBoard: React.FC<BacklogBoardProps> = ({ missions, selectedMissionId, onMissionClick }) => {
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-base font-extrabold leading-tight text-content-primary sm:text-lg">
          <Icon name="shoppingBag" className="w-5 h-5 text-brand-blue" />
          Backlog à dispatcher
        </h2>
        <span className="shrink-0 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-extrabold text-brand-blue ring-1 ring-brand-blue/25 dark:bg-brand-blue/20 dark:text-blue-200 dark:ring-blue-400/30">
          {missions.length} missions
        </span>
      </div>
      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1 sm:max-h-[500px]">
        {missions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-surface-border-subtle px-4 py-8 text-center text-sm font-medium text-content-muted">
            Aucune mission en attente de dispatch.
          </p>
        ) : null}
        {missions.map((mission) => {
          const isSelected = selectedMissionId === mission.id;
          return (
          <button
            key={mission.id}
            type="button"
            onClick={() => onMissionClick?.(mission.id)}
            aria-pressed={isSelected}
            className={`w-full rounded-xl border p-3 text-left transition-all sm:p-4 ${
              isSelected
                ? 'border-brand-blue bg-brand-blue/10 shadow-sm ring-2 ring-brand-blue/20'
                : 'border-surface-border-subtle bg-surface-muted/40 hover:border-brand-blue/30 hover:shadow-sm'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs font-extrabold text-brand-blue ring-1 ring-brand-blue/25 dark:bg-brand-blue/20 dark:text-blue-200 dark:ring-blue-400/30">
                    Ramassage
                  </span>
                  <span className="font-mono text-xs font-bold text-content-muted">{mission.id}</span>
                  <span className="text-xs font-semibold text-content-muted">{mission.time}</span>
                </div>
                <p className="text-sm font-extrabold text-content-primary">{mission.client}</p>
                <p className="mt-1 flex items-start gap-1 text-xs leading-5 text-content-muted">
                  <Icon name="mapPin" className="mt-0.5 h-3 w-3 shrink-0" />
                  <span className="break-words">{mission.pickup} → {mission.delivery}</span>
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 text-left sm:block sm:text-right">
                <p className="text-sm font-extrabold text-content-primary">{mission.amount.toLocaleString()} FC</p>
                <p className="text-xs font-medium text-content-muted">{mission.distance} km</p>
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
