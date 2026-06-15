import { Icon } from '../../Icon';
import { NOTIFICATIONS_WRITE_ENABLED } from '../../../lib/admin/notifications-api';
import type { NotificationItem } from '../../../lib/admin/notifications-types';

const statusStyle: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700', opened: 'bg-blue-100 text-blue-700',
  clicked: 'bg-violet-100 text-violet-700', unsubscribed: 'bg-gray-100 text-gray-600',
};
const channelStyle: Record<string, string> = {
  push: 'bg-blue-100 text-blue-700', whatsapp: 'bg-green-100 text-green-700',
  sms: 'bg-amber-100 text-amber-700', email: 'bg-violet-100 text-violet-700',
};

export function NotificationsTable({ items, onRetry, onView }: {
  items: NotificationItem[]; onRetry: (id: string) => void; onView: (item: NotificationItem) => void;
}) {
  if (!items.length) {
    return (
      <div className="bg-white rounded-2xl border border-dashed p-10 text-center">
        <p className="text-sm font-medium">Aucune notification trouvée.</p>
        <p className="text-xs text-gray-500 mt-2">Créez votre première notification ou connectez les événements backend.</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b"><h3 className="text-sm font-semibold text-gray-500 uppercase">Dernières notifications</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Titre</th><th className="px-4 py-3">Canal</th><th className="px-4 py-3">Événement</th>
              <th className="px-4 py-3">Audience</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Envoyé le</th>
              <th className="px-4 py-3">Livraison</th><th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3"><p className="font-semibold text-gray-900">{n.title}</p><p className="text-xs text-gray-400 truncate max-w-xs">{n.messagePreview}</p></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${channelStyle[n.channel] || 'bg-gray-100'}`}>{n.channelLabel}</span></td>
                <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{n.eventType}</code></td>
                <td className="px-4 py-3 text-gray-600">{n.audience}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle[n.status] || 'bg-gray-100'}`}>{n.statusLabel}</span></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{n.sentAt ? new Date(n.sentAt).toLocaleString('fr-FR') : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${n.deliveryRate}%` }} /></div>
                    <span className="text-xs">{n.deliveryRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => onView(n)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Voir"><Icon name="search" className="w-4 h-4" /></button>
                    {n.status === 'failed' && (
                      <button type="button" disabled={!NOTIFICATIONS_WRITE_ENABLED} onClick={() => onRetry(n.id)} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40" title="Réessayer"><Icon name="arrow-path" className="w-4 h-4" /></button>
                    )}
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
