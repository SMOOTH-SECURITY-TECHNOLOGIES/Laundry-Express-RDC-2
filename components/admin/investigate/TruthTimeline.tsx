import React from 'react';
import type { TruthEvent } from '../../../lib/admin/investigate-types';
import { Icon } from '../../Icon';

interface TruthTimelineProps {
  events: TruthEvent[];
}

const statusStyle: Record<string, { dot: string; bg: string }> = {
  success: { dot: 'bg-green-500', bg: 'bg-green-50' },
  warning: { dot: 'bg-yellow-500', bg: 'bg-yellow-50' },
  error: { dot: 'bg-red-500', bg: 'bg-red-50' },
  info: { dot: 'bg-blue-500', bg: 'bg-blue-50' },
};

const corridorBadge: Record<string, string> = {
  order: 'bg-blue-100 text-blue-700 border-blue-200',
  marketplace: 'bg-blue-100 text-blue-700 border-blue-200',
  payment: 'bg-green-100 text-green-700 border-green-200',
  paiement: 'bg-green-100 text-green-700 border-green-200',
  logistics: 'bg-orange-100 text-orange-700 border-orange-200',
  logistique: 'bg-orange-100 text-orange-700 border-orange-200',
};

export const TruthTimeline: React.FC<TruthTimelineProps> = ({ events }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
        TIMELINE DE VÉRITÉ
      </h3>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-3">
          {events.map((event) => {
            const style = statusStyle[event.status ?? 'info'] ?? statusStyle.info;
            const badge = corridorBadge[event.corridor.toLocaleLowerCase('fr-FR')] ?? 'bg-gray-100 text-gray-600 border-gray-200';
            return (
              <div key={event.id} className="relative flex gap-4">
                <div className="relative z-10 flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center ${style.dot}`}>
                    <Icon name="clock-history" className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className={`flex-1 rounded-xl border border-gray-100 p-3 ${style.bg}`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{event.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge}`}>
                        {event.corridor}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                      {event.date} {event.time}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">{event.actor}</span> — {event.proof}
                  </p>
                  {event.details && (
                    <p className="text-[11px] text-gray-500 mt-1">{event.details}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
