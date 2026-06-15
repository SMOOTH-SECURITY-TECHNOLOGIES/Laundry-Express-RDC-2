import type { ApiLog } from '../../../lib/admin/integrations-types';

export function ApiLogTable({ logs }: { logs: ApiLog[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Log Center</h3></div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500">
          <tr><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Endpoint</th><th className="px-4 py-3">Intégration</th><th className="px-4 py-3">Résultat</th><th className="px-4 py-3">Temps</th></tr>
        </thead>
        <tbody>{logs.map((l) => (
          <tr key={l.id} className="border-t">
            <td className="px-4 py-3 text-xs">{l.occurredAt ? new Date(l.occurredAt).toLocaleString('fr-FR') : '—'}</td>
            <td className="px-4 py-3">{l.source}</td>
            <td className="px-4 py-3 font-mono text-xs">{l.endpoint}</td>
            <td className="px-4 py-3 text-gray-500">{l.integrationName || l.userName || '—'}</td>
            <td className="px-4 py-3"><span className={l.status === 'success' ? 'text-green-600' : 'text-red-600'}>{l.statusLabel}</span></td>
            <td className="px-4 py-3">{l.responseTimeMs} ms</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
