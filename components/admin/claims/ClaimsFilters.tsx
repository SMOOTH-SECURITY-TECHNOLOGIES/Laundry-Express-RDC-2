import React from 'react';

interface ClaimsFiltersProps {
  statusFilter: string; priorityFilter: string; categoryFilter: string;
  onFilter: (type: string, value: string) => void;
}

const STATUSES = [['all', 'Tous statuts'], ['open', 'Ouvert'], ['investigating', 'Enquête'], ['escalated', 'Escaladé'], ['resolved', 'Résolu']];
const PRIORITIES = [['all', 'Toutes priorités'], ['critical', 'Critical'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']];
const CATEGORIES = [['all', 'Toutes catégories'], ['delivery', 'Livraison'], ['payment', 'Paiement'], ['quality', 'Qualité'], ['driver', 'Chauffeur'], ['partner', 'Partenaire']];

export function ClaimsFilters({ statusFilter, priorityFilter, categoryFilter, onFilter }: ClaimsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <select value={statusFilter} onChange={(e) => onFilter('status', e.target.value)} className="px-3 py-2 border rounded-xl text-sm bg-white">
        {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select value={priorityFilter} onChange={(e) => onFilter('priority', e.target.value)} className="px-3 py-2 border rounded-xl text-sm bg-white">
        {PRIORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select value={categoryFilter} onChange={(e) => onFilter('category', e.target.value)} className="px-3 py-2 border rounded-xl text-sm bg-white">
        {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
