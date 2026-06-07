import React from 'react';
import { Icon } from '../Icon';

const actions = [
  { label: 'Ajouter partenaire', icon: 'user' as const, target: 'Candidatures' },
  { label: 'Ajouter chauffeur', icon: 'truck' as const, target: 'Chauffeurs' },
  { label: 'Créer service', icon: 'list' as const, target: 'Services' },
  { label: 'Créer promotion', icon: 'gift' as const, target: 'Promotions' },
  { label: 'Envoyer campagne', icon: 'paper-plane' as const, target: 'Campagnes' },
  { label: 'Export financier', icon: 'arrow-down-tray' as const, target: 'Revenus' },
];

interface QuickActionsProps {
  onNavigate: (item: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-bold text-gray-900 mb-4">Actions rapides</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((a) => (
          <button
            type="button"
            key={a.label}
            onClick={() => onNavigate(a.target)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
          >
            <Icon name={a.icon} className="w-6 h-6 text-gray-600" />
            <span className="text-sm font-medium text-gray-700 text-center">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
