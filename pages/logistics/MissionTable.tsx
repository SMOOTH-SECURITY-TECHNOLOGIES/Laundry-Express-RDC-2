import React from 'react';
import { Icon } from '../../components/Icon';

interface Mission {
  id: string;
  status: string;
  driver: string;
  commune: string;
}

interface MissionTableProps {
  missions: Mission[];
}

const statusColor: Record<string, string> = {
  'En cours': 'bg-blue-50 text-brand-blue',
  'Assignée': 'bg-yellow-50 text-yellow-600',
  'En attente': 'bg-gray-100 text-gray-600',
};

export const MissionTable: React.FC<MissionTableProps> = ({ missions }) => {
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-content-primary sm:text-lg">
          <Icon name="shoppingBag" className="w-5 h-5 text-brand-blue" />
          Toutes les missions
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 sm:w-auto sm:py-2"
            />
          </div>
        </div>
      </div>
      <div className="space-y-3 sm:hidden">
        {missions.map((mission) => (
          <article key={mission.id} className="rounded-xl border border-surface-border-subtle bg-surface-muted/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-content-primary">{mission.id}</p>
                <p className="mt-1 text-sm text-content-muted">{mission.driver}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusColor[mission.status] || 'bg-gray-100 text-gray-600'}`}>
                {mission.status}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-content-muted">{mission.commune}</span>
              <button type="button" className="flex min-h-10 items-center gap-1 rounded-lg px-3 text-sm font-bold text-brand-blue hover:bg-brand-blue/10">
                <Icon name="search" className="h-3 w-3" />
                Voir
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-xs uppercase text-gray-500 border-b border-gray-100">
              <th className="text-left py-3 px-4 font-semibold">Mission</th>
              <th className="text-left py-3 px-4 font-semibold">Statut</th>
              <th className="text-left py-3 px-4 font-semibold">Chauffeur</th>
              <th className="text-left py-3 px-4 font-semibold">Commune</th>
              <th className="text-left py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {missions.map((mission) => (
              <tr key={mission.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4 font-bold text-content-primary">{mission.id}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor[mission.status] || 'bg-gray-100 text-gray-600'}`}>
                    {mission.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">{mission.driver}</td>
                <td className="py-3 px-4 text-gray-600">{mission.commune}</td>
                <td className="py-3 px-4">
                  <button className="text-brand-blue hover:text-content-primary text-xs font-bold flex items-center gap-1">
                    <Icon name="search" className="w-3 h-3" />
                    Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MissionTable;
