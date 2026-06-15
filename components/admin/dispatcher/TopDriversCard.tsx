import React from 'react';
import { Icon } from '../../Icon';
import type { TopDriver } from '../../../lib/admin/dispatcher-types';

interface TopDriversCardProps {
  drivers: TopDriver[];
}

export function TopDriversCard({ drivers }: TopDriversCardProps) {
  const top10 = drivers.slice(0, 10);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <Icon name="trophy" className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-900">Performance chauffeurs — Top 10</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="px-6 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">SLA</th>
              <th className="px-4 py-3 font-medium">Avis</th>
              <th className="px-6 py-3 font-medium">Missions</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((driver, index) => (
              <tr key={driver.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-gray-400 font-medium">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{driver.name}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{driver.score}</td>
                <td className="px-4 py-3 text-green-600">{driver.sla}%</td>
                <td className="px-4 py-3 text-amber-600">{driver.rating}</td>
                <td className="px-6 py-3 text-gray-600">{driver.missions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
