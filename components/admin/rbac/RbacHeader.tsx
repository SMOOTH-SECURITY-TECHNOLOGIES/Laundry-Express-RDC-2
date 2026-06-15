import { Icon } from '../../Icon';
import { RBAC_WRITE_ENABLED } from '../../../lib/admin/rbac-api';

export function RbacHeader({ search, onSearchChange, onRefresh, onExport, onNewRole, onCloneRole, onHistory }: {
  search: string; onSearchChange: (v: string) => void; onRefresh: () => void; onExport: () => void;
  onNewRole: () => void; onCloneRole: () => void; onHistory: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Icon name="shield-check" className="w-6 h-6 text-blue-600" /> Permissions & Contrôle d&apos;accès</h1>
          <p className="text-sm text-gray-500">Gérez les rôles, permissions, accès utilisateurs et politiques de sécurité.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Rechercher rôle, permission, utilisateur..." className="pl-9 pr-3 py-2 border rounded-xl text-sm w-72" />
          </div>
          <button type="button" onClick={onRefresh} className="px-3 py-2 border rounded-xl text-sm flex items-center gap-1"><Icon name="arrow-path" className="w-4 h-4" /> Actualiser</button>
          <button type="button" onClick={onExport} className="px-3 py-2 border rounded-xl text-sm flex items-center gap-1"><Icon name="arrow-down-tray" className="w-4 h-4" /> Exporter</button>
          <button type="button" disabled={!RBAC_WRITE_ENABLED} onClick={onNewRole} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm disabled:opacity-50">+ Nouveau rôle</button>
          <button type="button" disabled={!RBAC_WRITE_ENABLED} onClick={onCloneRole} className="px-3 py-2 bg-violet-600 text-white rounded-xl text-sm disabled:opacity-50">+ Cloner un rôle</button>
          <button type="button" onClick={onHistory} className="px-3 py-2 border rounded-xl text-sm">Historique</button>
        </div>
      </div>
      {!RBAC_WRITE_ENABLED && (
        <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-sm flex justify-between items-center">
          <span>Lecture seule. Les modifications RBAC nécessitent l&apos;activation backend sécurisée.</span>
          <span className="text-xs bg-amber-100 px-2 py-1 rounded-full font-medium">Read-only</span>
        </div>
      )}
    </div>
  );
}
