import React, { useMemo, useState } from 'react';
import { Icon } from '../../Icon';
import type { Driver, DriverStatus } from '../../../lib/admin/drivers-types';

interface DriverTableProps {
  drivers: Driver[];
  search?: string;
  onViewProfile: (driver: Driver) => void;
  onCall: (driver: Driver) => void;
  onWhatsApp: (driver: Driver) => void;
  onMap: (driver: Driver) => void;
  onHistory: (driver: Driver) => void;
  onSuspend: (driver: Driver) => void;
}

export function DriverTable({ drivers, search = '', onViewProfile, onCall, onWhatsApp, onMap, onHistory, onSuspend }: DriverTableProps) {
  const [statusFilter, setStatusFilter] = useState<DriverStatus | 'all'>('all');
  const [zoneFilter, setZoneFilter] = useState('all');

  const zones = useMemo(() => [...new Set(drivers.map((d) => d.zone))], [drivers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drivers.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (zoneFilter !== 'all' && d.zone !== zoneFilter) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || d.phone.includes(q) || d.zone.toLowerCase().includes(q) || d.vehicle.type.toLowerCase().includes(q);
    });
  }, [drivers, search, statusFilter, zoneFilter]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Icon name="users" className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-900">Tous les chauffeurs</h3>
          <span className="text-xs text-gray-400">{filtered.length}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as DriverStatus | 'all')} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5">
            <option value="all">Tous les statuts</option>
            <option value="available">Disponible</option>
            <option value="on_mission">En mission</option>
            <option value="pause">Pause</option>
            <option value="offline">Offline</option>
            <option value="suspended">Suspendu</option>
          </select>
          <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5">
            <option value="all">Toutes les zones</option>
            {zones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-3 font-medium">Photo</th>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Téléphone</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Partenaire</th>
              <th className="px-4 py-3 font-medium">Véhicule</th>
              <th className="px-4 py-3 font-medium">Zone</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Missions</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">SLA</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Note</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Revenu</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={12} className="px-6 py-8 text-center text-gray-400">Aucun chauffeur trouvé</td></tr>
            ) : filtered.map((d) => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${d.photoColor}`}>{d.photoInitials}</div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{d.phone}</td>
                <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{d.partner}</td>
                <td className="px-4 py-3"><span className="flex items-center gap-1 text-gray-600"><Icon name="truck" className="w-3.5 h-3.5" />{d.vehicle.type}</span></td>
                <td className="px-4 py-3 text-gray-500">{d.zone}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.statusColor}`}>{d.statusLabel}</span></td>
                <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{d.missions}</td>
                <td className="px-4 py-3 font-semibold text-green-600 hidden sm:table-cell">{d.sla}%</td>
                <td className="px-4 py-3 hidden md:table-cell"><span className="text-amber-500">★ {d.rating}</span></td>
                <td className="px-4 py-3 text-gray-700 hidden lg:table-cell">{d.revenue.toLocaleString('fr-FR')} $</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-0.5">
                    <ActBtn title="Voir profil" icon="user" onClick={() => onViewProfile(d)} />
                    <ActBtn title="Appeler" icon="phone" onClick={() => onCall(d)} />
                    <ActBtn title="WhatsApp" icon="whatsapp" onClick={() => onWhatsApp(d)} />
                    <ActBtn title="Voir carte" icon="mapPin" onClick={() => onMap(d)} />
                    <ActBtn title="Historique" icon="clock-history" onClick={() => onHistory(d)} />
                    <ActBtn title="Suspendre" icon="warning" onClick={() => onSuspend(d)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActBtn({ title, icon, onClick }: { title: string; icon: string; onClick: () => void }) {
  return (
    <button type="button" title={title} onClick={onClick} className="p-1.5 rounded-lg hover:bg-gray-100">
      <Icon name={icon as 'phone'} className="w-3.5 h-3.5 text-gray-500" />
    </button>
  );
}
