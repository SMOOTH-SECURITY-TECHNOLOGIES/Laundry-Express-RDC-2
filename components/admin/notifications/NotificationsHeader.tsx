import { Icon } from '../../Icon';
import { NOTIFICATIONS_WRITE_ENABLED } from '../../../lib/admin/notifications-api';

export function NotificationsHeader({ search, onSearchChange, onRefresh, onExport, onCreate }: {
  search: string; onSearchChange: (v: string) => void; onRefresh: () => void; onExport: () => void; onCreate: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-gray-500">Configurez et gérez toutes les notifications push, email, WhatsApp et SMS automatiques.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" onClick={onCreate} disabled={!NOTIFICATIONS_WRITE_ENABLED} title={!NOTIFICATIONS_WRITE_ENABLED ? 'Actions sensibles désactivées jusqu\'à validation du contrat backend.' : undefined} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              <Icon name="plus" className="w-4 h-4" /> Créer notification
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Rechercher notification, canal, événement..." className="pl-9 pr-3 py-2 border rounded-xl text-sm w-64" />
          </div>
          <button type="button" onClick={onRefresh} className="px-3 py-2 border rounded-xl text-sm font-medium flex items-center gap-1"><Icon name="arrow-path" className="w-4 h-4" /> Actualiser</button>
          <button type="button" onClick={onExport} className="px-3 py-2 border rounded-xl text-sm font-medium flex items-center gap-1"><Icon name="arrow-down-tray" className="w-4 h-4" /> Exporter</button>
        </div>
      </div>
    </div>
  );
}
