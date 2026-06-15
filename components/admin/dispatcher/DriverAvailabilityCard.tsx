import React from 'react';
import { Icon } from '../../Icon';
import type { AvailableDriver } from '../../../lib/admin/dispatcher-types';

interface DriverAvailabilityCardProps {
  drivers: AvailableDriver[];
  search?: string;
}

const availabilityColors: Record<string, string> = {
  available: 'text-green-600 bg-green-50',
  busy: 'text-orange-600 bg-orange-50',
  offline: 'text-gray-500 bg-gray-100',
  pause: 'text-blue-600 bg-blue-50',
};

export function DriverAvailabilityCard({ drivers, search = '' }: DriverAvailabilityCardProps) {
  const q = search.trim().toLowerCase();
  const filtered = q
    ? drivers.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.zone.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q)
      )
    : drivers;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <Icon name="users" className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">Chauffeurs disponibles</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="px-6 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Distance</th>
              <th className="px-4 py-3 font-medium">Disponibilité</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Missions</th>
              <th className="px-6 py-3 font-medium">Zone</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((driver) => (
              <tr key={driver.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 font-medium text-gray-900">{driver.name}</td>
                <td className="px-4 py-3 text-gray-500">{driver.distanceKm} km</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${availabilityColors[driver.availability]}`}>
                    {driver.availabilityLabel}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">{driver.score}</td>
                <td className="px-4 py-3 text-gray-600">{driver.activeMissions}</td>
                <td className="px-6 py-3 text-gray-500">{driver.zone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
