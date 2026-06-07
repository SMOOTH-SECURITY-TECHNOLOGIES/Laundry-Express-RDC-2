import React from 'react';
import { Icon } from '../../components/Icon';

interface ReadyDriver {
  name: string;
  vehicle: string;
  rating: number;
  commune: string;
  status: string;
  occupation: number;
  avgTime: number;
}

interface ReadyDriversPanelProps {
  drivers: ReadyDriver[];
}

export const ReadyDriversPanel: React.FC<ReadyDriversPanelProps> = ({ drivers }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
          <Icon name="users" className="w-5 h-5 text-green-600" />
          Chauffeurs prêts
        </h2>
        <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold">
          {drivers.filter((d) => d.status === 'Disponible').length} disponibles
        </span>
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {drivers.map((driver, index) => (
          <div
            key={index}
            className="p-4 rounded-xl border border-gray-100 hover:border-green-300/50 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-dark flex items-center justify-center text-white text-sm font-bold">
                  {driver.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-dark">{driver.name}</p>
                  <p className="text-xs text-gray-500">{driver.vehicle} · {driver.commune}</p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    driver.status === 'Disponible'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-yellow-50 text-yellow-600'
                  }`}
                >
                  {driver.status}
                </span>
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <Icon name="star" className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs font-bold text-gray-600">{driver.rating}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Icon name="chartBar" className="w-3 h-3" />
                {driver.occupation}% occupation
              </span>
              <span className="flex items-center gap-1">
                <Icon name="clock" className="w-3 h-3" />
                ~{driver.avgTime} min
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReadyDriversPanel;
