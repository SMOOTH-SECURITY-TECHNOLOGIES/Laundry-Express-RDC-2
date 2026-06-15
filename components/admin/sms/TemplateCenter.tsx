import type { SmsTemplate } from '../../../lib/admin/sms-types';
import { SMS_WRITE_ENABLED } from '../../../lib/admin/sms-api';

export function TemplateCenter({ templates, onEdit }: { templates: SmsTemplate[]; onEdit: (t: SmsTemplate) => void }) {
  if (!templates.length) return <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">Aucun template configuré.</div>;
  const best = [...templates].sort((a, b) => b.deliveryRate - a.deliveryRate)[0];
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b flex justify-between">
        <h3 className="font-semibold">Templates</h3>
        {best && <span className="text-xs text-gray-500">Meilleur : <strong>{best.name}</strong> ({best.deliveryRate}%)</span>}
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500">
          <tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Catégorie</th><th className="px-4 py-3">Utilisation</th><th className="px-4 py-3">Livraison</th><th className="px-4 py-3">Actions</th></tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="px-4 py-3 font-medium">{t.name}</td>
              <td className="px-4 py-3">{t.categoryLabel}</td>
              <td className="px-4 py-3">{t.usageCount.toLocaleString('fr-FR')}</td>
              <td className="px-4 py-3">{t.deliveryRate}%</td>
              <td className="px-4 py-3"><button type="button" disabled={!SMS_WRITE_ENABLED} onClick={() => onEdit(t)} className="text-xs text-blue-600 disabled:opacity-50">Modifier</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
