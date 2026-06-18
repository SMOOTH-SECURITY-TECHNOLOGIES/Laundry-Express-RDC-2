import React from 'react';
import { Icon } from '../Icon';
import { BottomSheet } from '../ui/BottomSheet';
import { StatusChip } from '../ui/StatusChip';
import { CARD, TYPO, SPACING } from '../ui/tokens';

interface DriverCandidate {
  id: string;
  name: string;
  zone: string;
  status: 'available' | 'busy';
  score: number;
  load: number;
  vehicleAvailable: boolean;
}

interface DispatcherAssignSheetProps {
  isOpen: boolean;
  missionId: string;
  onClose: () => void;
  drivers: DriverCandidate[];
  onAssign: (driverId: string) => void;
  isSaving: boolean;
}

const getScoreTone = (score: number): 'success' | 'warning' | 'danger' =>
  score >= 70 ? 'success' : score >= 40 ? 'warning' : 'danger';

export const DispatcherAssignSheet: React.FC<DispatcherAssignSheetProps> = ({
  isOpen,
  missionId,
  onClose,
  drivers,
  onAssign,
  isSaving,
}) => (
  <BottomSheet isOpen={isOpen} onClose={onClose} title={`Assigner ${missionId}`}>
    <div className="space-y-2">
      {drivers.map((driver) => (
        <button
          key={driver.id}
          type="button"
          disabled={!driver.vehicleAvailable || isSaving}
          onClick={() => {
            onAssign(driver.id);
            onClose();
          }}
          className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.98] ${
            driver.vehicleAvailable
              ? `${CARD.base}`
              : 'cursor-not-allowed rounded-2xl border border-surface-border bg-surface-muted opacity-50'
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${
              driver.status === 'available' ? 'bg-green-500' : 'bg-orange-500'
            }`}
          >
            {driver.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className={TYPO.cardTitle}>{driver.name}</p>
            <p className={TYPO.cardBody}>
              {driver.zone} · {driver.status === 'available' ? 'Disponible' : 'En mission'} · {driver.load} courses
            </p>
            {!driver.vehicleAvailable && (
              <p className="text-[10px] font-bold text-red-600">Véhicule indisponible</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <StatusChip
              label={String(driver.score)}
              tone={getScoreTone(driver.score)}
              size="md"
              variant="filled"
            />
          </div>
        </button>
      ))}

      {drivers.length === 0 && (
        <div className="py-8 text-center">
          <Icon name="users" className="mx-auto h-8 w-8 text-content-muted" />
          <p className="mt-2 text-sm font-bold text-content-muted">Aucun chauffeur disponible</p>
        </div>
      )}
    </div>
  </BottomSheet>
);

export default DispatcherAssignSheet;
