import React from 'react';
import { Icon } from '../../components/Icon';

interface BacklogMission {
  id: string;
  client: string;
  pickup: string;
  delivery: string;
  distance: number;
  commune: string;
  amount: number;
  time: string;
}

interface BacklogBoardProps {
  missions: BacklogMission[];
}

export const BacklogBoard: React.FC<BacklogBoardProps> = ({ missions }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
          <Icon name="shoppingBag" className="w-5 h-5 text-brand-blue" />
          Backlog à dispatcher
        </h2>
        <span className="px-3 py-1 rounded-full bg-blue-50 text-brand-blue text-xs font-bold">
          {missions.length} missions
        </span>
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="p-4 rounded-xl border border-gray-100 hover:border-brand-blue/30 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-brand-blue text-xs font-bold">
                    Ramassage
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{mission.time}</span>
                </div>
                <p className="text-sm font-bold text-brand-dark">{mission.client}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Icon name="mapPin" className="w-3 h-3" />
                  {mission.pickup} → {mission.delivery}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-brand-dark">{mission.amount.toLocaleString()} FC</p>
                <p className="text-xs text-gray-400">{mission.distance} km</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BacklogBoard;
