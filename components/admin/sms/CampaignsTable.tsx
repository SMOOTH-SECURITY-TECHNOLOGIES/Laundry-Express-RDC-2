import type { SmsCampaign } from '../../../lib/admin/sms-types';

export function CampaignsTable({ campaigns, onCreate }: { campaigns: SmsCampaign[]; onCreate: () => void }) {
  if (!campaigns.length) return <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">Aucune campagne active.</div>;
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b flex justify-between"><h3 className="font-semibold">Campagnes</h3><button type="button" onClick={onCreate} className="text-xs text-blue-600">+ Créer</button></div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500">
          <tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Audience</th><th className="px-4 py-3">Envoyés</th><th className="px-4 py-3">Livrés</th><th className="px-4 py-3">Réponses</th></tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="px-4 py-3 font-medium">{c.name}</td>
              <td className="px-4 py-3">{c.typeLabel}</td>
              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">{c.statusLabel}</span></td>
              <td className="px-4 py-3 text-gray-500">{c.audience}</td>
              <td className="px-4 py-3">{c.sentCount.toLocaleString('fr-FR')}</td>
              <td className="px-4 py-3">{c.deliveredCount.toLocaleString('fr-FR')}</td>
              <td className="px-4 py-3">{c.replyCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
