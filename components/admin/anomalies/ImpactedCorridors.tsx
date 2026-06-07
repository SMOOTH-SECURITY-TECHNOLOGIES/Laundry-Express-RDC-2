import React from 'react';
import type { ImpactedCorridor } from '../../../lib/admin/anomalies-types';
import { getCorridorLabel, getStatusBadgeColor } from '../../../lib/admin/anomalies-formatters';
import { Icon } from '../../Icon';

interface ImpactedCorridorsProps {
  corridors: ImpactedCorridor[];
  selectedCorridor: string;
  onSelect: (corridor: string) => void;
}

const corridorIconBg: Record<string, string> = {
  order: 'bg-blue-100 text-blue-600',
  payment: 'bg-amber-100 text-amber-600',
  logistics: 'bg-green-100 text-green-600',
  marketplace: 'bg-purple-100 text-purple-600',
  system: 'bg-gray-100 text-gray-600',
};

export default function ImpactedCorridors({ corridors, selectedCorridor, onSelect }: ImpactedCorridorsProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {corridors.map((c) => {
        const isSelected = selectedCorridor === c.corridor;
        return (
          <button
            key={c.corridor}
            type="button"
            onClick={() => onSelect(c.corridor)}
            className={`flex flex-col items-start gap-3 p-4 rounded-2xl border transition-colors text-left ${
              isSelected
                ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${corridorIconBg[c.corridor] ?? 'bg-gray-100 text-gray-600'}`}>
                <Icon name={c.icon as any} className="w-5 h-5" />
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(c.status)}`}>
                {c.status === 'healthy' ? 'Healthy' : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </span>
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900">{getCorridorLabel(c.corridor)}</span>
              <p className="text-xs text-gray-500 mt-1">{c.count} anomalie{c.count !== 1 ? 's' : ''}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
