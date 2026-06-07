import { Icon } from '../Icon';

interface ControlCenterHeaderProps {
  activeItem: string;
  onNavigate: (item: string) => void;
  onAction: (message: string) => void;
}

export const ControlCenterHeader = ({ activeItem, onNavigate, onAction }: ControlCenterHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 py-4 px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{activeItem}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Marketplace + Logistique + Vérité Opérationnelle en temps réel
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-56"
            />
          </div>

          {/* Actualiser */}
          <button
            type="button"
            onClick={() => onAction('Données du control center rafraîchies.')}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Icon name="arrow-path" className="w-4 h-4" />
            Actualiser
          </button>

          {/* Exporter */}
          <button
            type="button"
            onClick={() => onAction('Export CSV préparé pour la section active.')}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Icon name="arrow-down-tray" className="w-4 h-4" />
            Exporter
          </button>

          {/* Créer promotion */}
          <button
            type="button"
            onClick={() => onNavigate('Promotions')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Icon name="gift" className="w-4 h-4" />
            Créer promotion
          </button>

          {/* Ajouter partenaire */}
          <button
            type="button"
            onClick={() => onNavigate('Candidatures')}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Icon name="plus" className="w-4 h-4" />
            Ajouter partenaire
          </button>

          {/* Ajouter chauffeur */}
          <button
            type="button"
            onClick={() => onNavigate('Chauffeurs')}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Icon name="plus" className="w-4 h-4" />
            Ajouter chauffeur
          </button>
        </div>
      </div>
    </header>
  );
};
