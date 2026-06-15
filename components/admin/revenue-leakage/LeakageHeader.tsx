import { Icon } from '../../Icon';

interface LeakageHeaderProps {
  search: string;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onInvestigate: () => void;
  wsConnected?: boolean;
}

export function LeakageHeader(props: LeakageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 py-4 px-6 -mx-6 -mt-6 rounded-t-2xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Revenue Leakage Center</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Détection proactive des pertes financières • Paiements • Commissions • Facturation • Réconciliation</p>
          </div>
          {props.wsConnected && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={props.search} onChange={(e) => props.onSearchChange(e.target.value)} placeholder="Rechercher cas, commande, paiement..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Btn icon="arrow-path" label="Actualiser" onClick={props.onRefresh} />
            <Btn icon="arrow-down-tray" label="Exporter" onClick={props.onExport} />
            <button type="button" onClick={props.onInvestigate} className="flex items-center gap-2 px-3 py-2 bg-[#9333EA] text-white rounded-lg text-sm font-semibold hover:bg-purple-700"><Icon name="magnifying-glass-plus" className="w-4 h-4" /> Investiguer un cas</button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Btn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"><Icon name={icon as 'plus'} className="w-4 h-4" /> {label}</button>;
}
