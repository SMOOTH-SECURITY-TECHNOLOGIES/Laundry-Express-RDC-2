import { NOTIFICATIONS_WRITE_ENABLED } from '../../../lib/admin/notifications-api';
import type { NotificationTemplate } from '../../../lib/admin/notifications-types';

export function TemplateCenter({ templates, onEdit }: { templates: NotificationTemplate[]; onEdit: (t: NotificationTemplate) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase">Template Center</h3>
        <span className="text-xs text-gray-400">FR · EN · LN · SW</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 uppercase">
            <tr><th className="text-left pb-2">Nom</th><th className="text-left pb-2">Canal</th><th className="text-left pb-2">Événement</th><th className="text-left pb-2">Langue</th><th className="text-left pb-2">Statut</th><th className="text-right pb-2">Actions</th></tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="py-2 font-medium">{t.name}</td>
                <td className="py-2">{t.channel}</td>
                <td className="py-2"><code className="text-xs">{t.eventType}</code></td>
                <td className="py-2 uppercase">{t.language}</td>
                <td className="py-2"><span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">{t.status}</span></td>
                <td className="py-2 text-right">
                  <button type="button" disabled={!NOTIFICATIONS_WRITE_ENABLED} onClick={() => onEdit(t)} className="text-xs text-blue-600 font-semibold disabled:opacity-40">Modifier</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
