import type { WhatsappCampaign } from '../../../lib/admin/whatsapp-types';

export function CampaignCenter({ campaigns, onCreate }: { campaigns: WhatsappCampaign[]; onCreate: () => void }) {
  if (!campaigns.length) return <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">Aucune campagne active.</div>;
  const best = [...campaigns].sort((a, b) => (b.conversions / Math.max(b.sent, 1)) - (a.conversions / Math.max(a.sent, 1)))[0];
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold">Campaign Center</h3>
        <button type="button" onClick={onCreate} className="text-xs text-blue-600">+ Créer</button>
      </div>
      {best && <p className="px-4 py-2 text-xs bg-green-50 text-green-700">Meilleure conversion : <strong>{best.name}</strong> ({((best.conversions / Math.max(best.sent, 1)) * 100).toFixed(1)}%)</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr><th className="px-4 py-3">Campagne</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Envoyés</th><th className="px-4 py-3">Délivrés</th><th className="px-4 py-3">Ouverts</th><th className="px-4 py-3">Réponses</th><th className="px-4 py-3">Conversions</th></tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{c.typeLabel}</td>
                <td className="px-4 py-3">{c.sent.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3">{c.delivered.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3">{c.opened.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3">{c.replies.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 font-medium text-green-600">{c.conversions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
