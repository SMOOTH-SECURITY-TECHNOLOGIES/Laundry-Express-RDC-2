import React from 'react';
import { Icon } from '../Icon';

const actions = [
  { label: '+ Ajouter partenaire', icon: 'building' as const, target: 'Candidatures', tone: 'bg-blue-50 text-blue-700 border-blue-100' },
  { label: '+ Ajouter chauffeur', icon: 'truck' as const, target: 'Chauffeurs', tone: 'bg-green-50 text-green-700 border-green-100' },
  { label: '+ Créer promotion', icon: 'gift' as const, target: 'Promotions', tone: 'bg-orange-50 text-orange-700 border-orange-100' },
  { label: '+ Envoyer campagne', icon: 'paper-plane' as const, target: 'Campagnes', tone: 'bg-purple-50 text-purple-700 border-purple-100' },
  { label: '+ Export financier', icon: 'arrow-down-tray' as const, target: 'Revenus', tone: 'bg-slate-50 text-slate-700 border-slate-200' },
  { label: '+ Créer service', icon: 'list' as const, target: 'Services', tone: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
];

interface QuickActionsProps {
  onNavigate: (item: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="mb-4">
        <h3 className="font-bold text-gray-900">Actions rapides</h3>
        <p className="text-xs text-gray-500">Commandes administratives fréquentes.</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {actions.map((a) => (
          <button
            type="button"
            key={a.label}
            onClick={() => onNavigate(a.target)}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${a.tone}`}
          >
            <span className="flex items-center gap-3">
              <Icon name={a.icon} className="w-5 h-5" />
              <span className="text-sm font-extrabold">{a.label}</span>
            </span>
            <Icon name="arrowRight" className="h-4 w-4 opacity-70" />
          </button>
        ))}
      </div>
    </div>
  );
};
