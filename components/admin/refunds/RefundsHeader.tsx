import { Icon } from '../../Icon';

interface RefundsHeaderProps {
  search: string;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onCreatePromotion: () => void;
  onAddPartner: () => void;
  onNewPolicy: () => void;
  wsConnected?: boolean;
}

export function RefundsHeader(props: RefundsHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 py-4 px-6 -mx-6 -mt-6 rounded-t-2xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Remboursements</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Marketplace + Logistique + Vérité Opérationnelle en temps réel</p>
          </div>
          {props.wsConnected && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={props.search} onChange={(e) => props.onSearchChange(e.target.value)} placeholder="Rechercher client, commande, remboursement..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Btn icon="arrow-path" label="Actualiser" onClick={props.onRefresh} />
            <Btn icon="arrow-down-tray" label="Exporter" onClick={props.onExport} />
            <Btn icon="gift" label="Créer promotion" onClick={props.onCreatePromotion} primary="blue" />
            <Btn icon="users" label="Ajouter partenaire" onClick={props.onAddPartner} primary="green" />
            <button type="button" onClick={props.onNewPolicy} className="flex items-center gap-2 px-3 py-2 bg-[#9333EA] text-white rounded-lg text-sm font-semibold hover:bg-purple-700"><Icon name="plus" className="w-4 h-4" /> Nouvelle politique remboursement</button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Btn({ icon, label, onClick, primary }: { icon: string; label: string; onClick: () => void; primary?: string }) {
  const cls = primary === 'blue' ? 'bg-blue-600 text-white hover:bg-blue-700' : primary === 'green' ? 'bg-green-600 text-white hover:bg-green-700' : 'border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800';
  return <button type="button" onClick={onClick} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${cls}`}><Icon name={icon as 'plus'} className="w-4 h-4" /> {label}</button>;
}
