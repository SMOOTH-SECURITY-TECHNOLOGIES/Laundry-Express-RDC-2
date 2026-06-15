import { Icon } from '../../Icon';

export function PaymentGatewayHeader({ search, onSearchChange, onRefresh, onExport }: {
  search: string; onSearchChange: (v: string) => void; onRefresh: () => void; onExport: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Passerelles paiement</h1>
          <p className="text-sm text-gray-500">Surveillez toutes les transactions, fournisseurs et flux financiers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Rechercher transaction, référence..." className="pl-9 pr-3 py-2 border rounded-xl text-sm w-64" />
          </div>
          <button type="button" onClick={onRefresh} className="px-3 py-2 border rounded-xl text-sm flex items-center gap-1"><Icon name="arrow-path" className="w-4 h-4" /> Actualiser</button>
          <button type="button" onClick={onExport} className="px-3 py-2 border rounded-xl text-sm flex items-center gap-1"><Icon name="arrow-down-tray" className="w-4 h-4" /> Exporter</button>
        </div>
      </div>
    </div>
  );
}
