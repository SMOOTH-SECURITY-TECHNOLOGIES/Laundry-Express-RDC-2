import type { Webhook } from '../../../lib/admin/integrations-types';
import { INTEGRATIONS_WRITE_ENABLED } from '../../../lib/admin/integrations-api';

const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-700', disabled: 'bg-gray-100 text-gray-600', error: 'bg-red-100 text-red-700' };

export function WebhookTable({ webhooks, onAction, onSelect }: {
  webhooks: Webhook[]; onAction: (a: string, w: Webhook) => void; onSelect?: (w: Webhook) => void;
}) {
  if (!webhooks.length) return <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">Aucun webhook configuré.</div>;
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Webhook Center</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">URL</th><th className="px-4 py-3">Événement</th><th className="px-4 py-3">Dernier appel</th><th className="px-4 py-3">Succès</th><th className="px-4 py-3">Échecs</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Actions</th></tr>
          </thead>
          <tbody>{webhooks.map((w) => (
            <tr key={w.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => onSelect?.(w)}>
              <td className="px-4 py-3 font-medium">{w.name}</td>
              <td className="px-4 py-3 font-mono text-xs max-w-[180px] truncate">{w.url}</td>
              <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{w.event}</span></td>
              <td className="px-4 py-3 text-xs">{w.lastCallAt ? new Date(w.lastCallAt).toLocaleString('fr-FR') : '—'}</td>
              <td className="px-4 py-3 text-green-600">{w.successCount.toLocaleString('fr-FR')}</td>
              <td className="px-4 py-3 text-red-600">{w.failureCount}</td>
              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[w.status] || ''}`}>{w.statusLabel}</span></td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2 text-xs">
                  <button type="button" disabled={!INTEGRATIONS_WRITE_ENABLED} onClick={() => onAction('test', w)} className="text-blue-600 disabled:opacity-50">Tester</button>
                  <button type="button" disabled={!INTEGRATIONS_WRITE_ENABLED} onClick={() => onAction('replay', w)} className="text-violet-600 disabled:opacity-50">Rejouer</button>
                  <button type="button" onClick={() => onAction('logs', w)} className="text-gray-600">Logs</button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
