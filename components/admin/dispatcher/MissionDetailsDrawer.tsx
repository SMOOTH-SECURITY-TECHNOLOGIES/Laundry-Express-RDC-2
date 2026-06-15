import React from 'react';
import { Icon } from '../../Icon';
import type { ActiveMission } from '../../../lib/admin/dispatcher-types';

interface MissionDetailsDrawerProps {
  mission: ActiveMission | null;
  onClose: () => void;
  onOrderTruth: (orderId: string) => void;
  onInvestigate: (orderId: string) => void;
}

export function MissionDetailsDrawer({ mission, onClose, onOrderTruth, onInvestigate }: MissionDetailsDrawerProps) {
  if (!mission) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-xl h-full overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Détails mission</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <Icon name="xmark" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <Detail label="Mission" value={mission.id} />
          <Detail label="Commande" value={mission.orderId} />
          <Detail label="Client" value={mission.client} />
          <Detail label="Téléphone client" value={mission.clientPhone || '—'} />
          <Detail label="Chauffeur" value={mission.driverName} />
          <Detail label="Téléphone chauffeur" value={mission.driverPhone || '—'} />
          <Detail label="Adresse" value={mission.address} />
          <Detail label="Commune" value={mission.commune} />
          <Detail label="Poids" value={`${mission.weightKg} kg`} />
          <Detail label="Service" value={mission.service} />
          <Detail label="Statut" value={mission.statusLabel} />
          <Detail label="ETA" value={mission.eta} />

          <div className="flex flex-col gap-2 pt-4">
            <button
              type="button"
              onClick={() => onOrderTruth(mission.orderId)}
              className="w-full px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Voir Truth Timeline
            </button>
            <button
              type="button"
              onClick={() => onInvestigate(mission.orderId)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Investigate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
