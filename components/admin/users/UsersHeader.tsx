import { Icon } from '../../Icon';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  onExport: () => void;
}

export function UsersHeader({ search, onSearchChange, onRefresh, onExport }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 py-4 px-6 -mx-6 -mt-6 rounded-t-2xl">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Utilisateurs</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Marketplace • Logistique • Vérité Opérationnelle en temps réel</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher utilisateur, email, téléphone..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn icon="arrow-path" label="Actualiser" onClick={onRefresh} />
            <Btn icon="arrow-down-tray" label="Exporter" onClick={onExport} />
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Partenaires' }))} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
              <Icon name="plus" className="w-4 h-4" /> Ajouter partenaire
            </button>
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Chauffeurs' }))} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700">
              <Icon name="plus" className="w-4 h-4" /> Ajouter chauffeur
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Btn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800">
      <Icon name={icon as 'plus'} className="w-4 h-4" /> {label}
    </button>
  );
}
