import { NOTIFICATIONS_WRITE_ENABLED } from '../../../lib/admin/notifications-api';
import type { NotificationError } from '../../../lib/admin/notifications-types';

export function NotificationErrorCenter({ errors, onRetry }: { errors: NotificationError[]; onRetry: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Error Center</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 uppercase">
            <tr><th className="text-left pb-2">Canal</th><th className="text-left pb-2">Provider</th><th className="text-left pb-2">Code</th><th className="text-left pb-2">Message</th><th className="text-right pb-2">Occ.</th><th className="text-right pb-2">Action</th></tr>
          </thead>
          <tbody>
            {errors.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="py-2">{e.channel}</td><td className="py-2">{e.provider}</td>
                <td className="py-2"><code className="text-xs">{e.errorCode}</code></td>
                <td className="py-2 text-gray-600 max-w-xs truncate">{e.message}</td>
                <td className="py-2 text-right font-semibold">{e.occurrences}</td>
                <td className="py-2 text-right">
                  <button type="button" disabled={!NOTIFICATIONS_WRITE_ENABLED} onClick={() => onRetry(e.id)} className="text-xs text-blue-600 font-semibold disabled:opacity-40">Réessayer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
