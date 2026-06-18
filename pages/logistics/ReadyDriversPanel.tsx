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
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-base font-extrabold leading-tight text-content-primary sm:text-lg">
          <Icon name="users" className="w-5 h-5 text-green-600" />
          Chauffeurs prêts
        </h2>
        <span className="shrink-0 rounded-full bg-green-500/20 px-3 py-1 text-xs font-extrabold text-green-300 ring-1 ring-green-400/30">
          {drivers.filter((d) => d.status === 'Disponible').length} disponibles
        </span>
      </div>
      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1 sm:max-h-[500px]">
        {drivers.map((driver, index) => (
          <div
            key={index}
            className="rounded-xl border border-surface-border-subtle bg-surface-muted/40 p-3 transition-all hover:border-green-300/50 hover:shadow-sm sm:p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white">
                  {driver.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-content-primary">{driver.name}</p>
                  <p className="text-xs font-medium text-content-muted">{driver.vehicle} · {driver.commune}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                    driver.status === 'Disponible'
                      ? 'bg-green-500/20 text-green-300 ring-1 ring-green-400/30'
                      : 'bg-orange-500/20 text-orange-200 ring-1 ring-orange-400/30'
                  }`}
                >
                  {driver.status}
                </span>
                <div className="mt-0 flex items-center justify-end gap-1 sm:mt-1">
                  <Icon name="star" className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs font-extrabold text-content-primary">{driver.rating}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-content-muted">
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
