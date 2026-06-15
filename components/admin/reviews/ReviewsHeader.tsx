import { Icon } from '../../Icon';

export function ReviewsHeader({ search, onSearchChange, onRefresh, onExport }: {
  search: string; onSearchChange: (v: string) => void; onRefresh: () => void; onExport: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b py-4 px-6 -mx-6 -mt-6 rounded-t-2xl">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Feedback Intelligence Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Avis • Satisfaction • Réputation • Sentiment IA</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Rechercher avis, client, partenaire, chauffeur..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn icon="arrow-path" label="Actualiser" onClick={onRefresh} />
            <Btn icon="arrow-down-tray" label="Exporter" onClick={onExport} />
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Promotions' }))} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"><Icon name="gift" className="w-4 h-4" /> Créer promotion</button>
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Partenaires' }))} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold"><Icon name="plus" className="w-4 h-4" /> Ajouter partenaire</button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Btn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border hover:bg-gray-50"><Icon name={icon as 'plus'} className="w-4 h-4" /> {label}</button>;
}
