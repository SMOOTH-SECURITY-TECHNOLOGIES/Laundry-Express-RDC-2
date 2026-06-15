import type { NotificationUnsubscribe } from '../../../lib/admin/notifications-types';

export function UnsubscribeCenter({ items }: { items: NotificationUnsubscribe[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Unsubscribe Center</h3>
      <table className="w-full text-sm">
        <thead className="text-xs text-gray-500 uppercase"><tr><th className="text-left pb-2">Canal</th><th className="text-left pb-2">Contact</th><th className="text-left pb-2">Raison</th><th className="text-right pb-2">Date</th></tr></thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="py-2 capitalize">{u.channel}</td>
              <td className="py-2">{u.userEmail || u.userPhone || '—'}</td>
              <td className="py-2 text-gray-500">{u.reason || '—'}</td>
              <td className="py-2 text-right text-xs">{u.unsubscribedAt ? new Date(u.unsubscribedAt).toLocaleDateString('fr-FR') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
