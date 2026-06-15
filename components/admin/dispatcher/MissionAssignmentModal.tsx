import React, { useState, useEffect } from 'react';
import { Icon } from '../../Icon';
import type { BacklogMission, ActiveMission } from '../../../lib/admin/dispatcher-types';

interface MissionAssignmentModalProps {
  isOpen: boolean;
  mission: BacklogMission | ActiveMission | null;
  isReassign?: boolean;
  onConfirm: (missionId: string, driverId: string) => void;
  onClose: () => void;
}

function isBacklog(mission: BacklogMission | ActiveMission): mission is BacklogMission {
  return 'recommendedDriver' in mission;
}

export function MissionAssignmentModal({
  isOpen,
  mission,
  isReassign = false,
  onConfirm,
  onClose,
}: MissionAssignmentModalProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  useEffect(() => {
    if (mission && isBacklog(mission)) {
      setSelectedDriverId(mission.recommendedDriver?.id ?? null);
    } else {
      setSelectedDriverId(null);
    }
  }, [mission, isOpen]);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !mission) return null;

  const alternatives = isBacklog(mission) ? mission.alternatives : [];
  const recommended = isBacklog(mission) ? mission.recommendedDriver : null;
  const client = mission.client;
  const address = isBacklog(mission) ? mission.address : (mission as ActiveMission).address;
  const weight = isBacklog(mission) ? mission.weightKg : (mission as ActiveMission).weightKg;
  const service = isBacklog(mission) ? mission.service : (mission as ActiveMission).service;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {isReassign ? 'Réassigner la mission' : 'Assigner la mission'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <Icon name="xmark" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <InfoRow label="Mission" value={mission.id} />
          <InfoRow label="Client" value={client} />
          <InfoRow label="Adresse" value={address} />
          <InfoRow label="Poids" value={`${weight} kg`} />
          <InfoRow label="Service" value={service} />

          {recommended && (
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Chauffeur recommandé</p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="driver"
                  checked={selectedDriverId === recommended.id}
                  onChange={() => setSelectedDriverId(recommended.id)}
                  className="text-blue-600"
                />
                <div>
                  <p className="font-semibold text-gray-900">{recommended.name}</p>
                  <p className="text-xs text-gray-500">
                    Distance {recommended.distanceKm} km · Score {recommended.score}%
                  </p>
                </div>
              </label>
            </div>
          )}

          {alternatives.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Alternatives</p>
              <div className="space-y-2">
                {alternatives.map((alt) => (
                  <label
                    key={alt.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="driver"
                      checked={selectedDriverId === alt.id}
                      onChange={() => setSelectedDriverId(alt.id)}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{alt.name}</p>
                      <p className="text-xs text-gray-500">
                        Distance {alt.distanceKm} km · Score {alt.score}%
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
            Annuler
          </button>
          <button
            type="button"
            disabled={!selectedDriverId}
            onClick={() => selectedDriverId && onConfirm(mission.id, selectedDriverId)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}
