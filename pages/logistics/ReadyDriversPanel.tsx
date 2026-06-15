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
        <h2 className="text-lg font-extrabold text-content-primary flex items-center gap-2">
          <Icon name="users" className="w-5 h-5 text-green-600" />
          Chauffeurs prêts
        </h2>
        <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-extrabold text-green-300 ring-1 ring-green-400/30">
          {drivers.filter((d) => d.status === 'Disponible').length} disponibles
        </span>
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {drivers.map((driver, index) => (
          <div
            key={index}
            className="p-4 rounded-xl border border-surface-border-subtle bg-surface-muted/40 hover:border-green-300/50 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-dark flex items-center justify-center text-white text-sm font-bold">
                  {driver.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-extrabold text-content-primary">{driver.name}</p>
                  <p className="text-xs font-medium text-content-muted">{driver.vehicle} · {driver.commune}</p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                    driver.status === 'Disponible'
                      ? 'bg-green-500/20 text-green-300 ring-1 ring-green-400/30'
                      : 'bg-orange-500/20 text-orange-200 ring-1 ring-orange-400/30'
                  }`}
                >
                  {driver.status}
                </span>
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <Icon name="star" className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs font-extrabold text-content-primary">{driver.rating}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-content-muted">
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
