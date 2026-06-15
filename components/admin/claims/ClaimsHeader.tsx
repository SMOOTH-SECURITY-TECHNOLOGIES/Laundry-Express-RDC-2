import React from 'react';
import { Icon } from '../../Icon';

interface ClaimsHeaderProps {
  search: string;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  onNewClaim: () => void;
}

export function ClaimsHeader({ search, onSearchChange, onRefresh, onNewClaim }: ClaimsHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Claims & Dispute Resolution Center</h1>
            <p className="text-sm text-gray-500 mt-0.5">Réclamations • Litiges • Incidents • Qualité • Remboursements</p>
            <button type="button" onClick={onNewClaim} className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700">
              <Icon name="plus" className="w-4 h-4" /> Nouvelle réclamation
            </button>
          </div>
          <div className="flex flex-col gap-3 w-full xl:min-w-[480px]">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Rechercher réclamation, client, commande, #claim..." className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onRefresh} className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-gray-50">Actualiser</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
