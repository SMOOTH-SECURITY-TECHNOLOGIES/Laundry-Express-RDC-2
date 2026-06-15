import React from 'react';
import { Icon } from '../../Icon';

interface OrdersHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onCreatePromotion: () => void;
  onAddPartner: () => void;
  onAddDriver: () => void;
}

export function OrdersHeader({
  search,
  onSearchChange,
  onRefresh,
  onExport,
  onCreatePromotion,
  onAddPartner,
  onAddDriver,
}: OrdersHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-surface-card border-b border-surface-border py-4 px-6 -mx-6 -mt-6 rounded-t-2xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Gestion des commandes</h1>
            <p className="text-sm text-content-muted mt-0.5">
              Marketplace <span className="text-content-faint mx-1">›</span> Logistique{' '}
              <span className="text-content-faint mx-1">›</span> Paiements{' '}
              <span className="text-content-faint mx-1">›</span> Vérité opérationnelle
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher commande, client, partenaire..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-surface-border bg-surface-card text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-2 px-3 py-2 border border-surface-border rounded-lg text-sm text-content-primary bg-surface-card hover:bg-surface-muted transition-colors"
            >
              <Icon name="arrow-path" className="w-4 h-4" />
              Actualiser
            </button>
            <button
              type="button"
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-2 border border-surface-border rounded-lg text-sm text-content-primary bg-surface-card hover:bg-surface-muted transition-colors"
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
            <button
              type="button"
              onClick={onAddDriver}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              <Icon name="plus" className="w-4 h-4" />
              Ajouter chauffeur
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
