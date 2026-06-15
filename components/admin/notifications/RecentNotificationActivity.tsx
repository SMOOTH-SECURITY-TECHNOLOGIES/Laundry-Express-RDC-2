import { Icon } from '../../Icon';
import type { NotificationActivity } from '../../../lib/admin/notifications-types';

const iconMap: Record<string, 'paper-plane' | 'document-text' | 'calendar' | 'users' | 'warning'> = {
  sent: 'paper-plane', template_updated: 'document-text', scheduled: 'calendar', segment_updated: 'users', error: 'warning',
};

export function RecentNotificationActivity({ activities }: { activities: NotificationActivity[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Activités récentes</h3>
      <ul className="space-y-3">
        {activities.map((a) => (
          <li key={a.id} className="flex gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Icon name={iconMap[a.activityType] || 'bell'} className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-gray-800">{a.message}</p>
              <p className="text-xs text-gray-400">{a.actorName || 'Système'} · {a.createdAt ? new Date(a.createdAt).toLocaleString('fr-FR') : ''}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
