import React from 'react';
import type { AnomalyFilterState } from '../../../lib/admin/anomalies-types';
import { Icon } from '../../Icon';

interface AnomalyFiltersProps {
  filters: AnomalyFilterState;
  onChange: (filters: AnomalyFilterState) => void;
  onReset: () => void;
}

export default function AnomalyFilters({ filters, onChange, onReset }: AnomalyFiltersProps) {
  const update = (key: keyof AnomalyFilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.severity}
          onChange={(e) => update('severity', e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
        >
          <option value="">Sévérité — Tous</option>
          <option value="critical">Critique</option>
          <option value="major">Majeure</option>
          <option value="medium">Moyen</option>
          <option value="low">Faible</option>
        </select>

        <select
          value={filters.corridor}
          onChange={(e) => update('corridor', e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
        >
          <option value="">Corridor — Tous</option>
          <option value="order">Commande</option>
          <option value="payment">Paiement</option>
          <option value="logistics">Logistique</option>
          <option value="marketplace">Marketplace</option>
          <option value="system">Système</option>
        </select>

        <input
          type="date"
          value={filters.date}
          onChange={(e) => update('date', e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
        />

        <select
          value={filters.partner}
          onChange={(e) => update('partner', e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
        >
          <option value="">Partenaire — Tous</option>
        </select>

        <select
          value={filters.driver}
          onChange={(e) => update('driver', e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
        >
          <option value="">Chauffeur — Tous</option>
        </select>

        <select
          value={filters.zone}
          onChange={(e) => update('zone', e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
        >
          <option value="">Zone — Tous</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => update('status', e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
        >
          <option value="">Statut — Tous</option>
          <option value="open">Ouvert</option>
          <option value="investigating">Investigation</option>
          <option value="resolved">Résolu</option>
          <option value="ignored">Ignoré</option>
        </select>

        <button
          type="button"
          onClick={onReset}
          className="text-sm font-semibold text-brand-blue hover:underline whitespace-nowrap"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
