import React, { useState } from 'react';
import type { DisputeFilterState } from '../../../lib/admin/disputes-types';
import { Icon } from '../../Icon';

interface DisputeFiltersProps {
  filters: DisputeFilterState;
  partnerOptions: string[];
  onChange: (filters: DisputeFilterState) => void;
  onReset: () => void;
}

const selectClass =
  'px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white min-w-[130px]';

export function DisputeFilters({ filters, partnerOptions, onChange, onReset }: DisputeFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const update = (key: keyof DisputeFilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.status}
          onChange={(e) => update('status', e.target.value)}
          className={selectClass}
          aria-label="Statut"
        >
          <option value="">Statut</option>
          <option value="pending">En attente</option>
          <option value="under_review">En cours</option>
          <option value="approved">Approuvées</option>
          <option value="rejected">Rejetées</option>
          <option value="resolved">Résolues</option>
          <option value="escalated">Escaladées</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => update('type', e.target.value)}
          className={selectClass}
          aria-label="Type de demande"
        >
          <option value="">Type de demande</option>
          <option value="quality">Qualité</option>
          <option value="delay">Retard</option>
          <option value="cancellation">Annulation</option>
          <option value="missing_item">Article manquant</option>
          <option value="payment">Paiement</option>
          <option value="damaged_item">Article abîmé</option>
          <option value="duplicate_payment">Paiement double</option>
          <option value="other">Autres</option>
        </select>

        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white">
          <Icon name="calendar" className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update('dateFrom', e.target.value)}
            className="text-sm border-0 p-0 focus:ring-0 w-[108px]"
            aria-label="Date début"
          />
          <span className="text-gray-300 text-xs">—</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update('dateTo', e.target.value)}
            className="text-sm border-0 p-0 focus:ring-0 w-[108px]"
            aria-label="Date fin"
          />
        </div>

        <select
          value={filters.partner}
          onChange={(e) => update('partner', e.target.value)}
          className={selectClass}
          aria-label="Partenaire"
        >
          <option value="">Partenaire</option>
          {partnerOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <select
          value={filters.paymentMethod}
          onChange={(e) => update('paymentMethod', e.target.value)}
          className={selectClass}
          aria-label="Mode de paiement"
        >
          <option value="">Mode de paiement</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="card">Carte</option>
          <option value="cash">Cash</option>
        </select>

        <select
          value={filters.amountRange}
          onChange={(e) => update('amountRange', e.target.value)}
          className={selectClass}
          aria-label="Montant"
        >
          <option value="">Montant</option>
          <option value="0-10">&lt; 10 $</option>
          <option value="10-50">10–50 $</option>
          <option value="50+">&gt; 50 $</option>
        </select>

        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Icon name="bars3" className="w-4 h-4" />
          Filtres avancés
        </button>
      </div>

      {advancedOpen && (
        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-100">
          <select
            value={filters.severity}
            onChange={(e) => update('severity', e.target.value)}
            className={selectClass}
            aria-label="Sévérité"
          >
            <option value="">Sévérité</option>
            <option value="critical">Critique</option>
            <option value="major">Majeure</option>
            <option value="medium">Moyenne</option>
            <option value="low">Faible</option>
          </select>
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-semibold text-blue-600 hover:underline px-2"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
