import React from 'react';
import BacklogBoard from './BacklogBoard';
import MissionTable from './MissionTable';

const MOCK_BACKLOG = Array.from({ length: 24 }, (_, i) => ({
  id: `MSN-${String(i + 1).padStart(3, '0')}`,
  client: ['Mama Jeanne', 'Patrick L.', 'Sarah K.', 'David M.', 'Grace N.', 'Paul O.', 'Marie C.', 'Jean B.'][i % 8],
  pickup: ['Av. Lumumba 42', 'Boulevard du 30 Juin', 'Av. Kasavubu 15', 'Rue Kasa-Vubu 8', 'Av. Sendwe 27'][i % 5],
  delivery: ['Gombe, Kinshasa', 'Lingwala, Kinshasa', 'Barumbu, Kinshasa', 'Kinshasa, Kinshasa', 'Ngiri-Ngiri, Kinshasa'][i % 5],
  distance: Number((1.4 + (i % 9) * 0.8).toFixed(1)),
  commune: ['Gombe', 'Lingwala', 'Barumbu', 'Kinshasa', 'Ngiri-Ngiri', 'Bandalungwa', 'Kalamu', 'Matete'][i % 8],
  amount: 2500 + (i % 7) * 850,
  time: `${String(7 + (i % 12)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
}));

const MOCK_ACTIVE_MISSIONS = Array.from({ length: 38 }, (_, i) => ({
  id: `MSN-${String(i + 1).padStart(3, '0')}`,
  status: ['En cours', 'Assignée', 'En attente'][i % 3],
  driver: ['Kabongo M.', 'Tshimanga A.', 'Mutombo P.', 'Kalonji S.', 'Ngoy L.'][i % 5],
  commune: ['Gombe', 'Lingwala', 'Barumbu', 'Kinshasa'][i % 4],
}));

interface LogisticsMissionsProps {
  focusMissionId?: string | null;
  onClearFocus?: () => void;
}

export const LogisticsMissions: React.FC<LogisticsMissionsProps> = ({ focusMissionId, onClearFocus }) => {
  const focusedBacklog = focusMissionId ? MOCK_BACKLOG.filter((mission) => mission.id === focusMissionId) : MOCK_BACKLOG;
  const focusedActive = focusMissionId ? MOCK_ACTIVE_MISSIONS.filter((mission) => mission.id === focusMissionId) : MOCK_ACTIVE_MISSIONS;
  const hasFocusedMission = focusedBacklog.length > 0 || focusedActive.length > 0;

  return (
    <div className="space-y-6">
      {focusMissionId && (
        <div className="rounded-2xl border border-red-400/60 bg-red-500/10 p-4 text-sm text-content-primary">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-extrabold">Mission ciblée depuis l’alerte: {focusMissionId}</p>
              <p className="mt-1 text-content-muted">
                {hasFocusedMission
                  ? 'Les tableaux ci-dessous sont filtrés sur cette mission pour éviter la liste générale.'
                  : 'Aucune mission correspondante trouvée dans les données actuelles.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('logisticsFocusMissionId');
                onClearFocus?.();
              }}
              className="self-start rounded-xl border border-surface-border-subtle px-3 py-2 text-xs font-bold text-content-primary hover:bg-surface-muted sm:self-center"
            >
              Voir toutes les missions
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-surface-border-subtle bg-surface-card p-5 shadow-sm">
        <BacklogBoard missions={focusedBacklog} />
      </div>
      <div className="rounded-2xl border border-surface-border-subtle bg-surface-card p-5 shadow-sm">
        <MissionTable missions={focusedActive} />
      </div>
    </div>
  );
};
