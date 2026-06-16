import React from 'react';
import { Icon } from '../../components/Icon';

interface Driver {
  name: string;
  vehicle: string;
  rating: number;
  commune: string;
  status: string;
  occupation: number;
  avgTime: number;
}

interface DriversTableProps {
  drivers: Driver[];
}

export const DriversTable: React.FC<DriversTableProps> = ({ drivers }) => {
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-content-primary sm:text-lg">
          <Icon name="users" className="w-5 h-5 text-green-600" />
          Tous les chauffeurs
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
        {drivers.map((driver, index) => (
          <article key={index} className="rounded-xl border border-surface-border-subtle bg-surface-muted/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-dark text-xs font-bold text-white">
                  {driver.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-content-primary">{driver.name}</p>
                  <p className="text-sm text-content-muted">{driver.vehicle} · {driver.commune}</p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${
                  driver.status === 'Disponible'
                    ? 'bg-green-50 text-green-600'
                    : 'bg-yellow-50 text-yellow-600'
                }`}
              >
                {driver.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-content-muted">Note</p>
                <p className="mt-1 flex items-center gap-1 font-bold text-content-primary">
                  <Icon name="star" className="h-3 w-3 text-yellow-500" />
                  {driver.rating}
                </p>
              </div>
              <div>
                <p className="text-xs text-content-muted">Occupation</p>
                <p className="mt-1 font-bold text-content-primary">{driver.occupation}%</p>
              </div>
              <div>
                <p className="text-xs text-content-muted">Temps</p>
                <p className="mt-1 font-bold text-content-primary">~{driver.avgTime} min</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-xs uppercase text-gray-500 border-b border-gray-100">
              <th className="text-left py-3 px-4 font-semibold">Chauffeur</th>
              <th className="text-left py-3 px-4 font-semibold">Véhicule</th>
              <th className="text-left py-3 px-4 font-semibold">Commune</th>
              <th className="text-left py-3 px-4 font-semibold">Note</th>
              <th className="text-left py-3 px-4 font-semibold">Occupation</th>
              <th className="text-left py-3 px-4 font-semibold">Temps moyen</th>
              <th className="text-left py-3 px-4 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {drivers.map((driver, index) => (
              <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center text-white text-xs font-bold">
                      {driver.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <span className="font-bold text-brand-dark">{driver.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">{driver.vehicle}</td>
                <td className="py-3 px-4 text-gray-600">{driver.commune}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Icon name="star" className="w-3 h-3 text-yellow-500" />
                    <span className="font-bold text-gray-700">{driver.rating}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-blue rounded-full"
                      style={{ width: `${driver.occupation}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{driver.occupation}%</span>
                </td>
                <td className="py-3 px-4 text-gray-600">~{driver.avgTime} min</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      driver.status === 'Disponible'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-yellow-50 text-yellow-600'
                    }`}
                  >
                    {driver.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DriversTable;
