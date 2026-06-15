import type { IntegrationHealth } from '../../../lib/admin/integrations-types';

const statusColors: Record<string, string> = { healthy: 'bg-green-100 text-green-700', warning: 'bg-amber-100 text-amber-700', error: 'bg-red-100 text-red-700', critical: 'bg-red-100 text-red-700' };

export function IntegrationHealthGrid({ integrations }: { integrations: IntegrationHealth[] }) {
  const grouped = integrations.reduce<Record<string, IntegrationHealth[]>>((acc, i) => {
    (acc[i.category] ||= []).push(i);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b"><h3 className="font-semibold">{items[0]?.categoryLabel || cat}</h3></div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-3">Intégration</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Uptime</th><th className="px-4 py-3">Réponse</th><th className="px-4 py-3">Dernière synchro</th></tr></thead>
            <tbody>{items.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="px-4 py-3 font-medium">{i.name}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[i.status] || ''}`}>{i.statusLabel}</span></td>
                <td className="px-4 py-3">{i.uptimePct}%</td>
                <td className="px-4 py-3">{i.responseTimeMs} ms</td>
                <td className="px-4 py-3 text-xs text-gray-400">{i.lastSyncAt ? new Date(i.lastSyncAt).toLocaleString('fr-FR') : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
