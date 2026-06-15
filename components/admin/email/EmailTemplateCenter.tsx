import type { EmailTemplate } from '../../../lib/admin/email-types';
import { EMAIL_WRITE_ENABLED } from '../../../lib/admin/email-api';

export function EmailTemplateCenter({ templates, onEdit }: { templates: EmailTemplate[]; onEdit: (t: EmailTemplate) => void }) {
  if (!templates.length) return <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">Aucun template configuré.</div>;
  const best = [...templates].sort((a, b) => b.openRate - a.openRate)[0];
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b flex justify-between"><h3 className="font-semibold">Template Center</h3>{best && <span className="text-xs text-gray-500">Meilleur : <strong>{best.name}</strong> ({best.openRate}%)</span>}</div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Langue</th><th className="px-4 py-3">Sujet</th><th className="px-4 py-3">Utilisations</th><th className="px-4 py-3">Performance</th><th className="px-4 py-3">Actions</th></tr></thead>
        <tbody>{templates.map((t) => (
          <tr key={t.id} className="border-t">
            <td className="px-4 py-3 font-medium">{t.name}</td><td className="px-4 py-3">{t.typeLabel}</td><td className="px-4 py-3">{t.language}</td>
            <td className="px-4 py-3 max-w-[160px] truncate">{t.subject}</td><td className="px-4 py-3">{t.usageCount.toLocaleString('fr-FR')}</td>
            <td className="px-4 py-3">{t.openRate}% / {t.clickRate}%</td>
            <td className="px-4 py-3"><button type="button" disabled={!EMAIL_WRITE_ENABLED} onClick={() => onEdit(t)} className="text-xs text-blue-600 disabled:opacity-50">Modifier</button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
