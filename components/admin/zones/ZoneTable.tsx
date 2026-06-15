import React, { useMemo } from 'react';
import { Icon } from '../../Icon';
import type { Zone } from '../../../lib/admin/zones-types';

interface ZoneTableProps {
  zones: Zone[];
  search?: string;
  onView: (z: Zone) => void;
  onEdit: (z: Zone) => void;
  onTariffs: (z: Zone) => void;
  onHistory: (z: Zone) => void;
  onDelete: (z: Zone) => void;
}

export function ZoneTable({ zones, search = '', onView, onEdit, onTariffs, onHistory, onDelete }: ZoneTableProps) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter((z) => z.name.toLowerCase().includes(q) || z.code.toLowerCase().includes(q) || z.commune.toLowerCase().includes(q));
  }, [zones, search]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <Icon name="map" className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">Toutes les zones</h3>
        <span className="text-xs text-gray-400">({filtered.length})</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3 hidden sm:table-cell">Commune</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Tarif Base</th>
              <th className="px-4 py-3 hidden md:table-cell">Délai Moyen</th>
              <th className="px-4 py-3">Cmd/Jour</th>
              <th className="px-4 py-3">SLA</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((z) => (
              <tr key={z.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-900">{z.name}</td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{z.commune}</td>
                <td className="px-4 py-3 font-mono text-xs">{z.code}</td>
                <td className="px-4 py-3">{z.baseTariff.toFixed(2)} $</td>
                <td className="px-4 py-3 hidden md:table-cell">{z.avgDeliveryMinutes > 0 ? `${z.avgDeliveryMinutes} min` : '—'}</td>
                <td className="px-4 py-3">{z.ordersPerDay}</td>
                <td className="px-4 py-3 font-semibold text-green-600">{z.slaPercent > 0 ? `${z.slaPercent}%` : '—'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${z.statusColor}`}>{z.statusLabel}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-0.5">
                    <Act icon="magnifying-glass-plus" title="Voir" onClick={() => onView(z)} />
                    <Act icon="edit" title="Modifier" onClick={() => onEdit(z)} />
                    <Act icon="currencyDollar" title="Tarifs" onClick={() => onTariffs(z)} />
                    <Act icon="clock-history" title="Historique" onClick={() => onHistory(z)} />
                    <Act icon="xmark" title="Supprimer" onClick={() => onDelete(z)} />
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

function Act({ icon, title, onClick }: { icon: string; title: string; onClick: () => void }) {
  return (
    <button type="button" title={title} onClick={onClick} className="p-1.5 rounded-lg hover:bg-gray-100">
      <Icon name={icon as 'edit'} className="w-3.5 h-3.5 text-gray-500" />
    </button>
  );
}
