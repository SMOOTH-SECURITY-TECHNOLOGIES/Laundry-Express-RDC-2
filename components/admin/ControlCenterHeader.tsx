import { useEffect, useRef } from 'react';
import { Icon } from '../Icon';

interface ControlCenterHeaderProps {
  activeItem: string;
  onNavigate: (item: string) => void;
  onAction: (message: string) => void;
}

export const ControlCenterHeader = ({ activeItem, onNavigate, onAction }: ControlCenterHeaderProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isTruthDashboard = activeItem === 'Truth Dashboard';
  const isInvestigate = activeItem === 'Investigate';
  const headerCopy: Record<string, { title: string; subtitle: string; placeholder: string }> = {
    'Truth Dashboard': {
      title: 'Operational Truth Center',
      subtitle: 'Vue consolidée des anomalies, preuves et corridors de vérité opérationnelle.',
      placeholder: 'Rechercher commande, client, téléphone...',
    },
    'Order Truth': {
      title: 'Order Truth',
      subtitle: "Reconstruire automatiquement la réalité d'une commande à partir des événements système et des preuves.",
      placeholder: 'Rechercher Order ID, UUID, client...',
    },
    Investigate: {
      title: 'Cross-Corridor Investigation',
      subtitle: 'Reconstruction multi-ID entre les corridors de vérité',
      placeholder: 'Rechercher commande, client, téléphone, partenaire...',
    },
    Analytics: {
      title: 'Analytics',
      subtitle: 'Marketplace + Logistique + Vérité Opérationnelle',
      placeholder: 'Rechercher commande, partenaire, chauffeur...',
    },
    'Activity Log': {
      title: 'Activity Center',
      subtitle: 'Journal vivant de la plateforme, corrélé au Truth System.',
      placeholder: 'Recherche universelle : ORD-7845, PAY-442, Jean K...',
    },
    Partenaires: {
      title: 'Gestion des partenaires',
      subtitle: 'Marketplace + conformité + revenus partenaires',
      placeholder: 'Rechercher partenaire, service, ville, téléphone...',
    },
    Candidatures: {
      title: 'Candidatures partenaires',
      subtitle: 'Pipeline d’acquisition et d’onboarding partenaires',
      placeholder: 'Rechercher un partenaire, email, téléphone, ville...',
    },
    Services: {
      title: 'Gestion des services',
      subtitle: 'Catalogue • Revenus • Marketplace • Truth Monitoring',
      placeholder: 'Rechercher service, catégorie, partenaire...',
    },
  };
  const copy = headerCopy[activeItem] || {
    title: activeItem,
    subtitle: 'Marketplace + Logistique + Vérité Opérationnelle en temps réel',
    placeholder: 'Rechercher...',
  };

  useEffect(() => {
    const focusSearch = () => searchInputRef.current?.focus();
    window.addEventListener('admin-focus-search', focusSearch);
    return () => window.removeEventListener('admin-focus-search', focusSearch);
  }, []);

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 py-4 px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{copy.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {copy.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={copy.placeholder}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-56"
            />
          </div>

          {/* Actualiser */}
          <button
            type="button"
            onClick={() => {
              if (isInvestigate) {
                window.dispatchEvent(new CustomEvent('admin-refresh-investigation'));
                return;
              }
              if (activeItem === 'Services') {
                window.dispatchEvent(new CustomEvent('admin-services-refresh'));
                return;
              }
              onAction('Données du control center rafraîchies.');
            }}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Icon name="arrow-path" className="w-4 h-4" />
            Actualiser
          </button>

          <button
            type="button"
            onClick={() => {
              if (isInvestigate) {
                window.dispatchEvent(new CustomEvent('admin-export-investigation'));
                return;
              }
              if (activeItem === 'Services') {
                window.dispatchEvent(new CustomEvent('admin-services-export'));
                return;
              }
              onAction('Export CSV préparé pour la section active.');
            }}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Icon name="arrow-down-tray" className="w-4 h-4" />
            {isInvestigate ? 'Exporter PDF' : 'Exporter'}
          </button>

          {isInvestigate && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('admin-run-investigation-audit'))}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon name="shield-check" className="w-4 h-4" />
              Audit complet
            </button>
          )}

          {isInvestigate ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('admin-open-investigation-modal'))}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              <Icon name="plus" className="w-4 h-4" />
              Créer investigation
            </button>
          ) : isTruthDashboard ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('admin-open-audit-modal'))}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Icon name="shield" className="w-4 h-4" />
              Lancer audit
            </button>
          ) : activeItem === 'Services' ? (
            <button
              type="button"
              onClick={() => onNavigate('Promotions')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Icon name="gift" className="w-4 h-4" />
              Créer promotion
            </button>
          ) : activeItem === 'Partenaires' ? (
            <button
              type="button"
              onClick={() => onNavigate('Candidatures')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Icon name="users" className="w-4 h-4" />
              Inviter partenaire
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('Promotions')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Icon name="gift" className="w-4 h-4" />
              Créer promotion
            </button>
          )}

          {activeItem === 'Services' ? (
            <>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('admin-services-create'))}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Icon name="plus" className="w-4 h-4" />
                Ajouter service
              </button>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('admin-services-category'))}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <Icon name="plus" className="w-4 h-4" />
                Ajouter catégorie
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('Candidatures')}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Icon name="plus" className="w-4 h-4" />
                Ajouter partenaire
              </button>
              <button
                type="button"
                onClick={() => onNavigate('Chauffeurs')}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <Icon name="plus" className="w-4 h-4" />
                Ajouter chauffeur
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
