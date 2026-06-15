import type { ApiKey } from '../../../lib/admin/integrations-types';
import { INTEGRATIONS_WRITE_ENABLED } from '../../../lib/admin/integrations-api';

const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-700', disabled: 'bg-gray-100 text-gray-600', revoked: 'bg-red-100 text-red-700', expired: 'bg-amber-100 text-amber-700' };

export function ApiKeysTable({ keys, onAction }: { keys: ApiKey[]; onAction: (a: string, k: ApiKey) => void }) {
  if (!keys.length) return <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">Aucune intégration configurée.<br /><span className="text-xs">Connectez votre premier service.</span></div>;
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">API Keys Center</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Scope</th><th className="px-4 py-3">Créé par</th><th className="px-4 py-3">Dernière utilisation</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Actions</th></tr>
          </thead>
          <tbody>{keys.map((k) => (
            <tr key={k.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{k.name}</td>
              <td className="px-4 py-3">{k.typeLabel}</td>
              <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">{k.scope}</td>
              <td className="px-4 py-3">{k.createdBy || '—'}</td>
              <td className="px-4 py-3 text-xs">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('fr-FR') : '—'}</td>
              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[k.status] || ''}`}>{k.statusLabel}</span></td>
              <td className="px-4 py-3">
                <div className="flex gap-2 text-xs">
                  <button type="button" onClick={() => onAction('view', k)} className="text-blue-600">Voir</button>
                  <button type="button" disabled={!INTEGRATIONS_WRITE_ENABLED} onClick={() => onAction('regenerate', k)} className="text-violet-600 disabled:opacity-50">Régénérer</button>
                  <button type="button" disabled={!INTEGRATIONS_WRITE_ENABLED} onClick={() => onAction('disable', k)} className="text-amber-600 disabled:opacity-50">Désactiver</button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
