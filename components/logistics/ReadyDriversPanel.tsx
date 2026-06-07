import React, { useState } from 'react';
import { Icon } from '../Icon';

interface Driver {
  id: string;
  name: string;
  vehicle: string;
  rating: number;
  commune: string;
  status: string;
  occupation: number;
  avgTime: number;
}

interface ReadyDriversPanelProps {
  drivers: Driver[];
  onAssign: (driverId: string) => void;
  onViewProfile: (driverId: string) => void;
}

const MAX_VISIBLE = 5;

const avatarColors = [
  'bg-brand-blue',
  'bg-brand-orange',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-rose-500',
];

export const ReadyDriversPanel: React.FC<ReadyDriversPanelProps> = ({
  drivers,
  onAssign,
  onViewProfile,
}) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? drivers : drivers.slice(0, MAX_VISIBLE);
  const remaining = drivers.length - MAX_VISIBLE;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-brand-dark">Chauffeurs prêts</h2>
          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-green-100 text-green-700 text-sm font-bold">
            {drivers.length}
          </span>
        </div>
        <Icon name="truck" className="w-5 h-5 text-gray-400" />
      </div>

      {drivers.length === 0 ? (
        <div className="px-5 py-10 text-center text-gray-400 text-sm">
          Aucun chauffeur disponible pour le moment.
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-50">
            {visible.map((driver, index) => (
              <div
                key={driver.id}
                className="px-5 py-4 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${avatarColors[index % avatarColors.length]}`}
                  >
                    {driver.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-brand-dark truncate">
                        {driver.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                        <Icon name="star" className="w-3.5 h-3.5 text-yellow-400" />
                        {driver.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{driver.vehicle}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Icon name="mapPin" className="w-3.5 h-3.5 text-gray-400" />
                    {driver.commune}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Disponible
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Occupation</span>
                    <span className="font-medium">{driver.occupation}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        driver.occupation > 80
                          ? 'bg-red-400'
                          : driver.occupation > 50
                          ? 'bg-yellow-400'
                          : 'bg-green-400'
                      }`}
                      style={{ width: `${driver.occupation}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAssign(driver.id)}
                    className="px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 transition-colors"
                  >
                    Assigner
                  </button>
                  <button
                    onClick={() => onViewProfile(driver.id)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Voir profil
                  </button>
                </div>
              </div>
            ))}
          </div>

          {drivers.length > MAX_VISIBLE && (
            <div className="border-t border-gray-100">
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-5 py-3 text-sm font-semibold text-brand-blue hover:bg-blue-50/50 transition-colors flex items-center justify-center gap-2"
              >
                {expanded
                  ? 'Voir moins'
                  : `Voir tous les chauffeurs (+${remaining})`}
                <Icon
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  className="w-4 h-4"
                />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
