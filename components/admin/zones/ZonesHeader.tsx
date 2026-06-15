import { Icon } from '../../Icon';

interface ZonesHeaderProps {
  search: string;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onCreatePromotion: () => void;
  onAddPartner: () => void;
  onCreateZone: () => void;
}

export function ZonesHeader({ search, onSearchChange, onRefresh, onExport, onCreatePromotion, onAddPartner, onCreateZone }: ZonesHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 py-4 px-6 -mx-6 -mt-6 rounded-t-2xl">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des zones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Marketplace + Logistique + Vérité Opérationnelle en temps réel</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Rechercher zone, commune, code..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onRefresh} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><Icon name="arrow-path" className="w-4 h-4" /> Actualiser</button>
            <button type="button" onClick={onExport} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><Icon name="arrow-down-tray" className="w-4 h-4" /> Exporter</button>
            <button type="button" onClick={onCreatePromotion} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"><Icon name="gift" className="w-4 h-4" /> Créer promotion</button>
            <button type="button" onClick={onAddPartner} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"><Icon name="users" className="w-4 h-4" /> Ajouter partenaire</button>
            <button type="button" onClick={onCreateZone} className="flex items-center gap-2 px-3 py-2 bg-[#9333EA] text-white rounded-lg text-sm font-semibold hover:bg-purple-700"><Icon name="plus" className="w-4 h-4" /> Créer zone</button>
          </div>
        </div>
      </div>
    </header>
  );
}
