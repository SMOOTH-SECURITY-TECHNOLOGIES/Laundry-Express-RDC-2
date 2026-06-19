import React, { useEffect, useRef, useState } from 'react';
import BacklogBoard from './BacklogBoard';
import MissionTable from './MissionTable';
import { Icon } from '../../components/Icon';
import { getMissionRows, storeBacklogMissionForDispatch, type DataMode, type LogisticsMissionRow } from '../../services/logistics-api';
import type { DispatchBacklogItem } from '../../lib/logistics/backlog-model';

interface LogisticsMissionsProps {
  focusMissionId?: string | null;
  focusAlertTitle?: string | null;
  focusType?: string | null;
  focusZone?: string | null;
  onClearFocus?: () => void;
  onNavigate?: (
    section: string,
    options?: { missionId?: string; zone?: string; missionFocusType?: string },
  ) => void;
  onActionFeedback?: (message: string) => void;
}

export const LogisticsMissions: React.FC<LogisticsMissionsProps> = ({
  focusMissionId,
  focusAlertTitle,
  focusType,
  focusZone,
  onClearFocus,
  onNavigate,
  onActionFeedback,
}) => {
  const [backlog, setBacklog] = useState<DispatchBacklogItem[]>([]);
  const [missions, setMissions] = useState<LogisticsMissionRow[]>([]);
  const [dataMode, setDataMode] = useState<DataMode>('degraded');
  const [selectedBacklogId, setSelectedBacklogId] = useState<string | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    getMissionRows().then((result) => {
      if (!mounted) return;
      setBacklog(result.data.backlog);
      setMissions(result.data.missions);
      setDataMode(result.mode);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const hasFocus = Boolean(focusMissionId || focusAlertTitle || focusType || focusZone);
  const zoneMatch = (commune: string) => !focusZone || commune.toLowerCase() === focusZone.toLowerCase();
  const focusedBacklog = hasFocus
    ? backlog.filter((mission) => {
        if (focusMissionId) return mission.mission_id === focusMissionId;
        if (focusType === 'waiting') return zoneMatch(mission.commune);
        if (focusType === 'late') return false;
        return zoneMatch(mission.commune);
      })
    : backlog;
  const focusedActive = hasFocus
    ? missions.filter((mission) => {
        if (focusMissionId) return mission.id === focusMissionId;
        if (focusType === 'late') return mission.status === 'En cours' && zoneMatch(mission.commune);
        if (focusType === 'waiting') return mission.status === 'En attente' && zoneMatch(mission.commune);
        return zoneMatch(mission.commune);
      })
    : missions;

  const hasFocusedMission = focusedBacklog.length > 0 || focusedActive.length > 0;

  const selectedBacklogMission = selectedBacklogId
    ? focusedBacklog.find((mission) => mission.mission_id === selectedBacklogId) ??
      backlog.find((mission) => mission.mission_id === selectedBacklogId) ??
      null
    : null;

  const handleBacklogClick = (missionId: string) => {
    setSelectedBacklogId(missionId);
  };

  const openDispatchForMission = (mission: DispatchBacklogItem) => {
    storeBacklogMissionForDispatch(mission);
    sessionStorage.setItem('logisticsFocusMissionId', mission.mission_id);
    onNavigate?.('dispatch', { missionId: mission.mission_id });
    onActionFeedback?.(`Ouverture du dispatch pour ${mission.mission_id}.`);
  };

  useEffect(() => {
    if (!selectedBacklogMission) return;
    detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedBacklogMission]);

  useEffect(() => {
    if (focusMissionId) setSelectedBacklogId(focusMissionId);
  }, [focusMissionId]);

  return (
    <div className="space-y-6">
      {hasFocus && (
        <div className="flex flex-col gap-2 rounded-2xl border border-brand-blue/20 bg-blue-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-brand-blue">
              {focusMissionId
                ? `Mission ciblée depuis l’alerte: ${focusMissionId}`
                : focusAlertTitle
                  ? `Alerte missions ciblée: ${focusAlertTitle}`
                  : focusType === 'late'
                    ? 'Alerte missions ciblée: Retards opérationnels'
                    : focusType === 'waiting'
                      ? 'Alerte missions ciblée: File d’attente'
                      : 'Filtre actif'}
            </p>
            <button type="button" onClick={onClearFocus} className="text-sm font-black text-brand-blue underline">
              Effacer le filtre
            </button>
          </div>
          {focusZone && <p className="text-sm font-semibold text-brand-blue">Zone ciblée: {focusZone}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        <BacklogBoard
          missions={focusedBacklog}
          selectedMissionId={selectedBacklogId}
          onMissionClick={handleBacklogClick}
        />
        {selectedBacklogMission ? (
          <div ref={detailPanelRef} className="rounded-2xl border border-surface-border-subtle bg-surface-card p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-content-muted">Détail mission</p>
            <p className="mt-2 font-mono text-sm font-black text-content-primary">{selectedBacklogMission.mission_id}</p>
            <p className="mt-1 text-lg font-extrabold text-content-primary">{selectedBacklogMission.client}</p>
            <div className="mt-3 space-y-2 text-sm text-content-muted">
              <p className="flex items-center gap-2">
                <Icon name="mapPin" className="h-4 w-4 text-brand-blue" />
                {selectedBacklogMission.adresse} → {selectedBacklogMission.delivery}
              </p>
              <p>{selectedBacklogMission.commune}</p>
              <p>{selectedBacklogMission.distance} km · ETA {selectedBacklogMission.eta}</p>
              <p>
                <span className="font-extrabold text-content-primary">{selectedBacklogMission.montant.toLocaleString('fr-FR')} FC</span>
                {' · '}
                {selectedBacklogMission.priorite}
                {' · '}
                {selectedBacklogMission.statut}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openDispatchForMission(selectedBacklogMission)}
                className="min-h-11 rounded-xl bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue/90"
              >
                Dispatcher
              </button>
              <button
                type="button"
                onClick={() => setSelectedBacklogId(null)}
                className="min-h-11 rounded-xl border border-surface-border-subtle px-4 py-2 text-sm font-bold text-content-primary"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-surface-border-subtle p-8 text-center text-sm text-content-muted">
            Sélectionnez une mission du backlog pour voir le détail et lancer le dispatch.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-surface-border-subtle bg-surface-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-content-primary">Toutes les missions</h2>
          <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-content-muted">
            {dataMode === 'backend' ? 'LIVE' : 'READ-ONLY'} · {missions.length}
          </span>
        </div>
        <MissionTable missions={hasFocusedMission ? focusedActive : missions} />
      </div>
    </div>
  );
};

export default LogisticsMissions;
