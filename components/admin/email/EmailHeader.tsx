import { Icon } from '../../Icon';
import { EMAIL_WRITE_ENABLED } from '../../../lib/admin/email-api';

export function EmailHeader({ search, onSearchChange, onRefresh, onExport, onCreateEmail }: {
  search: string; onSearchChange: (v: string) => void; onRefresh: () => void; onExport: () => void; onCreateEmail: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Icon name="envelope" className="w-6 h-6 text-blue-600" /> Email Center</h1>
          <p className="text-sm text-gray-500">Gérez les emails transactionnels, marketing, factures et notifications clients.</p>
          {!EMAIL_WRITE_ENABLED && <p className="text-xs text-amber-600 mt-1">Actions sensibles désactivées jusqu'à validation backend.</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Rechercher email, destinataire, template..." className="pl-9 pr-3 py-2 border rounded-xl text-sm w-72" />
          </div>
          <button type="button" onClick={onRefresh} className="px-3 py-2 border rounded-xl text-sm flex items-center gap-1"><Icon name="arrow-path" className="w-4 h-4" /> Actualiser</button>
          <button type="button" onClick={onExport} className="px-3 py-2 border rounded-xl text-sm flex items-center gap-1"><Icon name="arrow-down-tray" className="w-4 h-4" /> Exporter</button>
          <button type="button" onClick={onCreateEmail} disabled={!EMAIL_WRITE_ENABLED} className="px-3 py-2 bg-violet-700 text-white rounded-xl text-sm disabled:opacity-50">Créer email</button>
        </div>
      </div>
    </div>
  );
}
