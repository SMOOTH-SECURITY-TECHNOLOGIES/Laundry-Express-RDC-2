import { Icon } from '../../Icon';
import { NOTIFICATIONS_WRITE_ENABLED } from '../../../lib/admin/notifications-api';

const actions = [
  { label: 'Créer notification push', icon: 'bell' as const },
  { label: 'Créer message WhatsApp', icon: 'whatsapp' as const },
  { label: 'Créer SMS', icon: 'device-phone-mobile' as const },
  { label: 'Créer email', icon: 'envelope' as const },
  { label: 'Créer template', icon: 'document-text' as const },
  { label: 'Segments d\'audience', icon: 'users' as const },
  { label: 'Automatisations', icon: 'arrow-path' as const },
  { label: 'Planifier campagne', icon: 'calendar' as const },
];

export function NotificationQuickActions({ onAction }: { onAction: (label: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Actions rapides</h3>
      <div className="space-y-2">
        {actions.map((a) => (
          <button key={a.label} type="button" disabled={!NOTIFICATIONS_WRITE_ENABLED} title={!NOTIFICATIONS_WRITE_ENABLED ? 'Actions sensibles désactivées' : undefined}
            onClick={() => onAction(a.label)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50 disabled:opacity-50 text-left">
            <Icon name={a.icon} className="w-4 h-4 text-blue-600" />{a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
