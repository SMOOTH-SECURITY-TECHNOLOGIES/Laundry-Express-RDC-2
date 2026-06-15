import React from 'react';
import { Icon } from '../../Icon';

interface DispatcherHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onCreatePromotion: () => void;
  onAddPartner: () => void;
  onAddDriver: () => void;
  onAutoDispatch: () => void;
  wsConnected?: boolean;
}

export function DispatcherHeader({
  search,
  onSearchChange,
  onRefresh,
  onExport,
  onCreatePromotion,
  onAddPartner,
  onAddDriver,
  onAutoDispatch,
  wsConnected,
}: DispatcherHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 py-4 px-6 -mx-6 -mt-6 rounded-t-2xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Cockpit Dispatcher</h1>
              {wsConnected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Marketplace + Logistique + Vérité Opérationnelle
            </p>
          </div>
          <button
            type="button"
            onClick={onAutoDispatch}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors self-start"
          >
            <Icon name="fire" className="w-4 h-4" />
            Auto Dispatch
          </button>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher mission, commande, chauffeur..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onRefresh} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Icon name="arrow-path" className="w-4 h-4" />
              Actualiser
            </button>
            <button type="button" onClick={onExport} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Icon name="arrow-down-tray" className="w-4 h-4" />
              Exporter
            </button>
            <button type="button" onClick={onCreatePromotion} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Icon name="gift" className="w-4 h-4" />
              Créer promotion
            </button>
            <button type="button" onClick={onAddPartner} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              <Icon name="users" className="w-4 h-4" />
              Ajouter partenaire
            </button>
            <button type="button" onClick={onAddDriver} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
              <Icon name="plus" className="w-4 h-4" />
              Ajouter chauffeur
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
