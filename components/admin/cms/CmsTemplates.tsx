import type { CmsTemplate } from '../../../lib/admin/cms-types';

export function CmsTemplates({ templates }: { templates: CmsTemplate[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Modèles de page</h3>
      <div className="grid grid-cols-2 gap-2">
        {templates.map((t) => (
          <div key={t.key} className="border rounded-xl p-3 bg-gray-50">
            <p className="font-medium text-sm">{t.label}</p>
            <p className="text-xs text-gray-500 mt-1">{t.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
