import React, { useMemo } from 'react';
import { Icon } from '../../Icon';
import type { BacklogMission } from '../../../lib/admin/dispatcher-types';

interface DispatchBacklogTableProps {
  missions: BacklogMission[];
  search?: string;
  onAssign: (mission: BacklogMission) => void;
}

export function DispatchBacklogTable({ missions, search = '', onAssign }: DispatchBacklogTableProps) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return missions;
    return missions.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.orderId.toLowerCase().includes(q) ||
        m.client.toLowerCase().includes(q) ||
        (m.recommendedDriver?.name.toLowerCase().includes(q) ?? false)
    );
  }, [missions, search]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name="list" className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-900">Backlog à dispatcher</h3>
          <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            {filtered.length}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="px-6 py-3 font-medium">Mission</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Heure</th>
              <th className="px-4 py-3 font-medium">Chauffeur recommandé</th>
              <th className="px-6 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                  Aucune mission en attente d&apos;assignation
                </td>
              </tr>
            ) : (
              filtered.map((mission) => (
                <tr key={mission.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs font-semibold text-gray-900">{mission.id}</td>
                  <td className="px-4 py-3 text-gray-700">{mission.client}</td>
                  <td className="px-4 py-3 text-gray-500">{mission.scheduledTime}</td>
                  <td className="px-4 py-3">
                    {mission.recommendedDriver ? (
                      <div className="text-xs">
                        <span className="font-medium text-gray-800">{mission.recommendedDriver.name}</span>
                        <span className="text-gray-400 ml-1">
                          ({mission.recommendedDriver.distanceKm} km · Score {mission.recommendedDriver.score})
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Aucun chauffeur</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <button
                      type="button"
                      onClick={() => onAssign(mission)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      Assigner
                    </button>
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
