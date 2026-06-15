import React from 'react';
import { Icon } from '../../Icon';
import type { DispatcherIncident } from '../../../lib/admin/dispatcher-types';

interface IncidentCenterCardProps {
  incidents: DispatcherIncident[];
  onInvestigate: (incident: DispatcherIncident) => void;
}

const priorityStyles: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  major: 'bg-orange-100 text-orange-700 border-orange-200',
  minor: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

export function IncidentCenterCard({ incidents, onInvestigate }: IncidentCenterCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="warning" className="w-5 h-5 text-red-600" />
        <h3 className="text-sm font-semibold text-gray-900">Incident Center</h3>
        <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
          {incidents.length}
        </span>
      </div>

      <div className="space-y-3">
        {incidents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucun incident actif</p>
        ) : (
          incidents.map((incident) => (
            <div key={incident.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{incident.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {incident.missionId} · {incident.createdAt}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityStyles[incident.priority]}`}>
                  {incident.priorityLabel}
                </span>
                <button
                  type="button"
                  onClick={() => onInvestigate(incident)}
                  className="px-2.5 py-1 rounded-lg bg-gray-900 text-white text-[10px] font-medium hover:bg-gray-800 transition-colors"
                >
                  Investigate
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
