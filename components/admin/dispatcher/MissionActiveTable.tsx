import React, { useMemo } from 'react';
import { Icon } from '../../Icon';
import type { ActiveMission } from '../../../lib/admin/dispatcher-types';

interface MissionActiveTableProps {
  missions: ActiveMission[];
  search?: string;
  onPhone: (mission: ActiveMission) => void;
  onWhatsApp: (mission: ActiveMission) => void;
  onGps: (mission: ActiveMission) => void;
  onDetails: (mission: ActiveMission) => void;
  onReassign: (mission: ActiveMission) => void;
  onCancel: (mission: ActiveMission) => void;
  onOrderTruth: (orderId: string) => void;
}

export function MissionActiveTable({
  missions,
  search = '',
  onPhone,
  onWhatsApp,
  onGps,
  onDetails,
  onReassign,
  onCancel,
  onOrderTruth,
}: MissionActiveTableProps) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return missions;
    return missions.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.orderId.toLowerCase().includes(q) ||
        m.driverName.toLowerCase().includes(q) ||
        m.client.toLowerCase().includes(q)
    );
  }, [missions, search]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <Icon name="truck" className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">Missions actives</h3>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Temps réel
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="px-6 py-3 font-medium">Mission</th>
              <th className="px-4 py-3 font-medium">Chauffeur</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">ETA</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                  Aucune mission active
                </td>
              </tr>
            ) : (
              filtered.map((mission) => (
                <tr key={mission.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-mono text-xs font-semibold text-gray-900">{mission.id}</div>
                    <button
                      type="button"
                      onClick={() => onOrderTruth(mission.orderId)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 mt-0.5"
                    >
                      Voir Truth Timeline
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{mission.driverName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${mission.statusColor}`}>
                      {mission.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{mission.eta}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-0.5">
                      <ActionBtn title="Téléphone" icon="phone" onClick={() => onPhone(mission)} />
                      <ActionBtn title="WhatsApp" icon="whatsapp" onClick={() => onWhatsApp(mission)} />
                      <ActionBtn title="Navigation GPS" icon="mapPin" onClick={() => onGps(mission)} />
                      <ActionBtn title="Détails" icon="magnifying-glass-plus" onClick={() => onDetails(mission)} />
                      <ActionBtn title="Réassigner" icon="arrow-path" onClick={() => onReassign(mission)} />
                      <ActionBtn title="Annuler" icon="xmark" onClick={() => onCancel(mission)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionBtn({ title, icon, onClick }: { title: string; icon: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <Icon name={icon as 'phone'} className="w-3.5 h-3.5 text-gray-500" />
    </button>
  );
}
