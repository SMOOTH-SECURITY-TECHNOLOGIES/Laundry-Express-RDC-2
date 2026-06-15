import type { PopularTemplate } from '../../../lib/admin/notifications-types';

export function PopularTemplatesTable({ templates }: { templates: PopularTemplate[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Templates populaires</h3>
      <table className="w-full text-sm">
        <thead className="text-xs text-gray-500 uppercase"><tr><th className="text-left pb-2">Template</th><th className="text-right pb-2">Utilisations</th><th className="text-right pb-2">Livraison</th></tr></thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="py-2"><p className="font-medium">{t.name}</p><p className="text-xs text-gray-400">{t.channel}</p></td>
              <td className="py-2 text-right">{t.usageCount.toLocaleString('fr-FR')}</td>
              <td className="py-2 text-right">{t.deliveryRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
