import { Icon } from '../../Icon';

interface SlaHeaderProps {
  search: string;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onCreatePromotion: () => void;
  onAddPartner: () => void;
  onAddDriver: () => void;
  onCreateRule: () => void;
}

export function SlaHeader(props: SlaHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 py-4 px-6 -mx-6 -mt-6 rounded-t-2xl">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SLA Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Performance opérationnelle • Temps réel • Impact financier</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={props.search} onChange={(e) => props.onSearchChange(e.target.value)} placeholder="Rechercher commande, zone, partenaire..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Btn icon="arrow-path" label="Actualiser" onClick={props.onRefresh} />
            <Btn icon="arrow-down-tray" label="Exporter" onClick={props.onExport} />
            <Btn icon="gift" label="Créer promotion" onClick={props.onCreatePromotion} primary="blue" />
            <Btn icon="users" label="Ajouter partenaire" onClick={props.onAddPartner} primary="green" />
            <Btn icon="plus" label="Ajouter chauffeur" onClick={props.onAddDriver} primary="purple" />
            <button type="button" onClick={props.onCreateRule} className="flex items-center gap-2 px-3 py-2 bg-[#9333EA] text-white rounded-lg text-sm font-semibold hover:bg-purple-700"><Icon name="plus" className="w-4 h-4" /> Créer règle SLA</button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Btn({ icon, label, onClick, primary }: { icon: string; label: string; onClick: () => void; primary?: string }) {
  const cls = primary === 'blue' ? 'bg-blue-600 text-white hover:bg-blue-700' : primary === 'green' ? 'bg-green-600 text-white hover:bg-green-700' : primary === 'purple' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50';
  return <button type="button" onClick={onClick} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${cls}`}><Icon name={icon as 'plus'} className="w-4 h-4" /> {label}</button>;
}
