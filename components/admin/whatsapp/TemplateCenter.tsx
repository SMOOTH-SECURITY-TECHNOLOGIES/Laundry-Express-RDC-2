import type { WhatsappTemplate } from '../../../lib/admin/whatsapp-types';
import { WHATSAPP_WRITE_ENABLED } from '../../../lib/admin/whatsapp-api';

const statusColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700', disabled: 'bg-gray-100 text-gray-600',
};

export function TemplateCenter({ templates, onAction }: { templates: WhatsappTemplate[]; onAction: (action: string, t: WhatsappTemplate) => void }) {
  if (!templates.length) return <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">Aucun template configuré.</div>;
  const best = [...templates].sort((a, b) => b.deliveryRate - a.deliveryRate)[0];
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold">Template Center</h3>
        {best && <span className="text-xs text-gray-500">Meilleur : <strong>{best.name}</strong> ({best.deliveryRate}%)</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Catégorie</th><th className="px-4 py-3">Langue</th><th className="px-4 py-3">Statut Meta</th><th className="px-4 py-3">Utilisation</th><th className="px-4 py-3">Livraison</th><th className="px-4 py-3">Actions</th></tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3">{t.categoryLabel}</td>
                <td className="px-4 py-3">{t.language}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[t.metaStatus] || ''}`}>{t.metaStatusLabel}</span></td>
                <td className="px-4 py-3">{t.usageCount.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3">{t.deliveryRate}%</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 text-xs">
                    <button type="button" disabled={!WHATSAPP_WRITE_ENABLED} onClick={() => onAction('edit', t)} className="text-blue-600 disabled:opacity-50">Modifier</button>
                    <button type="button" disabled={!WHATSAPP_WRITE_ENABLED} onClick={() => onAction('test', t)} className="text-green-600 disabled:opacity-50">Tester</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
