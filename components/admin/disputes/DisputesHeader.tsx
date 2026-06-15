import React from 'react';
import { Icon } from '../../Icon';

interface DisputesHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onCreatePromotion: () => void;
  onAddPartner: () => void;
  onNewManualRequest: () => void;
  readOnly?: boolean;
}

export function DisputesHeader({
  search,
  onSearchChange,
  onRefresh,
  onExport,
  onCreatePromotion,
  onAddPartner,
  onNewManualRequest,
  readOnly,
}: DisputesHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden -mx-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col gap-3 min-w-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des litiges</h1>
                {readOnly && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"
                    title="Les actions de résolution seront activées lorsque les contrats API seront alignés."
                  >
                    Read-only
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Remboursements • Litiges • Conflits • Protection plateforme
              </p>
            </div>
            <button
              type="button"
              onClick={onNewManualRequest}
              className="inline-flex items-center gap-2 self-start px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm"
            >
              <Icon name="plus" className="w-4 h-4" />
              Nouvelle demande manuelle
            </button>
          </div>

          <div className="flex flex-col gap-3 w-full xl:w-auto xl:min-w-[520px]">
            <div className="relative">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Rechercher ID, client, commande, partenaire..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onRefresh}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon name="arrow-path" className="w-4 h-4" />
                Actualiser
              </button>
              <button
                type="button"
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon name="arrow-down-tray" className="w-4 h-4" />
                Exporter
              </button>
              <button
                type="button"
                onClick={onCreatePromotion}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Icon name="gift" className="w-4 h-4" />
                Créer promotion
              </button>
              <button
                type="button"
                onClick={onAddPartner}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Icon name="users" className="w-4 h-4" />
                Ajouter partenaire
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
