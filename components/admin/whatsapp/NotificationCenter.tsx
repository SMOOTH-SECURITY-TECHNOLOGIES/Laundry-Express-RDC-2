import type { WhatsappNotification } from '../../../lib/admin/whatsapp-types';

const statusColors: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', failed: 'bg-red-100 text-red-700', read: 'bg-blue-100 text-blue-700',
};

export function NotificationCenter({ notifications }: { notifications: WhatsappNotification[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Notification Center</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr><th className="px-4 py-3">Notification</th><th className="px-4 py-3">Template</th><th className="px-4 py-3">Destinataire</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Date</th></tr>
          </thead>
          <tbody>
            {notifications.map((n) => (
              <tr key={n.id} className="border-t">
                <td className="px-4 py-3">{n.eventLabel}</td>
                <td className="px-4 py-3 text-gray-500">{n.templateName || '—'}</td>
                <td className="px-4 py-3">{n.recipient}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[n.status] || ''}`}>{n.statusLabel}</span></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{n.createdAt ? new Date(n.createdAt).toLocaleString('fr-FR') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
