import type { EmailCampaign } from '../../../lib/admin/email-types';

export function EmailCampaignCenter({ campaigns }: { campaigns: EmailCampaign[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Campaign Center</h3></div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-3">Campagne</th><th className="px-4 py-3">Audience</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Envoyés</th><th className="px-4 py-3">Ouverts</th><th className="px-4 py-3">Clics</th><th className="px-4 py-3">Conversions</th><th className="px-4 py-3">Revenus</th><th className="px-4 py-3">ROI</th></tr></thead>
        <tbody>{campaigns.map((c) => (
          <tr key={c.id} className="border-t">
            <td className="px-4 py-3 font-medium">{c.name}</td><td className="px-4 py-3">{c.audience}</td>
            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">{c.statusLabel}</span></td>
            <td className="px-4 py-3">{c.sentCount.toLocaleString('fr-FR')}</td><td className="px-4 py-3">{c.openedCount.toLocaleString('fr-FR')}</td>
            <td className="px-4 py-3">{c.clickedCount.toLocaleString('fr-FR')}</td><td className="px-4 py-3">{c.conversions}</td>
            <td className="px-4 py-3">{c.revenue.toLocaleString('fr-FR')} $</td><td className="px-4 py-3 font-medium text-green-600">{c.roi}x</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
