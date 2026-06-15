import React from 'react';
import { Icon } from '../../Icon';

interface DriversHeaderProps {
  search: string;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onAddDriver: () => void;
  onImport: () => void;
  wsConnected?: boolean;
}

export function DriversHeader({ search, onSearchChange, onRefresh, onExport, onAddDriver, onImport, wsConnected }: DriversHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 py-4 px-6 -mx-6 -mt-6 rounded-t-2xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Gestion des chauffeurs</h1>
            {wsConnected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Réseau logistique • Performance • SLA • Disponibilité temps réel</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Nom, téléphone, véhicule, zone..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onRefresh} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <Icon name="arrow-path" className="w-4 h-4" /> Actualiser
            </button>
            <button type="button" onClick={onExport} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <Icon name="arrow-down-tray" className="w-4 h-4" /> Exporter
            </button>
            <button type="button" onClick={onImport} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <Icon name="document-arrow-down" className="w-4 h-4" /> Importer chauffeurs
            </button>
            <button type="button" onClick={onAddDriver} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
              <Icon name="plus" className="w-4 h-4" /> Ajouter chauffeur
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
