import React, { useState } from 'react';
import { Icon } from '../Icon';

interface Mission {
  id: string;
  client: string;
  clientPhone: string;
  pickupAddress: string;
  pickupCommune: string;
  deliveryAddress: string;
  deliveryCommune: string;
  distance: number;
  amount: number;
  time: string;
  status: string;
  priority?: 'high' | 'normal' | 'low';
}

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

interface BacklogBoardProps {
  missions: Mission[];
  drivers: Driver[];
  onAssign: (missionId: string, driverId: string) => void;
  onPriorize: (missionId: string) => void;
  onView: (missionId: string) => void;
  formatPrice: (price: number) => string;
}

const MAX_VISIBLE = 5;

const priorityBadge: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  normal: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-600',
};

export const BacklogBoard: React.FC<BacklogBoardProps> = ({
  missions,
  onAssign,
  onPriorize,
  onView,
  formatPrice,
}) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? missions : missions.slice(0, MAX_VISIBLE);
  const remaining = missions.length - MAX_VISIBLE;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-brand-dark">Backlog à dispatcher</h2>
          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-bold">
            {missions.length}
          </span>
        </div>
        <Icon name="list" className="w-5 h-5 text-gray-400" />
      </div>

      {missions.length === 0 ? (
        <div className="px-5 py-10 text-center text-gray-400 text-sm">
          Aucune mission en attente de dispatch.
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-50">
            {visible.map((mission) => (
              <div
                key={mission.id}
                className="px-5 py-4 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-brand-dark">
                    #{mission.id}
                  </span>
                  {mission.priority && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityBadge[mission.priority]}`}
                    >
                      {mission.priority === 'high'
                        ? 'Haute'
                        : mission.priority === 'low'
                        ? 'Basse'
                        : 'Normale'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                  <Icon name="user" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-medium">{mission.client}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">{mission.clientPhone}</span>
                </div>

                <div className="flex items-center gap-2 text-sm mb-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{mission.pickupCommune}</span>
                  </span>
                  <Icon name="arrowRight" className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                    <span className="text-gray-700">{mission.deliveryCommune}</span>
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Icon name="map" className="w-3.5 h-3.5" />
                    {mission.distance} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="currencyDollar" className="w-3.5 h-3.5" />
                    {formatPrice(mission.amount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="clock" className="w-3.5 h-3.5" />
                    {mission.time}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAssign(mission.id, '')}
                    className="px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 transition-colors"
                  >
                    Assigner
                  </button>
                  <button
                    onClick={() => onView(mission.id)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Voir
                  </button>
                  <button
                    onClick={() => onPriorize(mission.id)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Prioriser
                  </button>
                </div>
              </div>
            ))}
          </div>

          {missions.length > MAX_VISIBLE && (
            <div className="border-t border-gray-100">
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-5 py-3 text-sm font-semibold text-brand-blue hover:bg-blue-50/50 transition-colors flex items-center justify-center gap-2"
              >
                {expanded
                  ? 'Voir moins'
                  : `Voir toutes les missions ouvertes (+${remaining})`}
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
