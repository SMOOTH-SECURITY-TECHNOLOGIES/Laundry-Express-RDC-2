import { Icon } from '../../Icon';
import type { ActivityLogEvent } from '../../../lib/admin/activity-log-types';

export function EventDetailDrawer({ event, onClose }: { event: ActivityLogEvent | null; onClose: () => void }) {
  if (!event) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="flex-1 bg-black/30" onClick={onClose} aria-label="Fermer" />
      <aside className="w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="font-bold text-lg">Détail événement</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><Icon name="xmark" className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-6 text-sm">
          <section>
            <h3 className="font-semibold text-gray-500 text-xs uppercase mb-2">Métadonnées</h3>
            <dl className="space-y-2">
              <div className="flex justify-between"><dt className="text-gray-500">Event ID</dt><dd className="font-mono font-medium">{event.eventId}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Timestamp</dt><dd>{event.occurredAt ? new Date(event.occurredAt).toLocaleString('fr-FR') : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Rôle</dt><dd>{event.actorRole || event.actorTypeLabel}</dd></div>
              {event.ipAddress && <div className="flex justify-between"><dt className="text-gray-500">IP</dt><dd className="font-mono">{event.ipAddress}</dd></div>}
              {event.device && <div className="flex justify-between"><dt className="text-gray-500">Device</dt><dd>{event.device}</dd></div>}
              {event.browser && <div className="flex justify-between"><dt className="text-gray-500">Browser</dt><dd>{event.browser}</dd></div>}
              {event.osName && <div className="flex justify-between"><dt className="text-gray-500">OS</dt><dd>{event.osName}</dd></div>}
            </dl>
          </section>
          <section>
            <h3 className="font-semibold text-gray-500 text-xs uppercase mb-2">Ressource</h3>
            <p><span className="text-gray-500">Type:</span> {event.resourceType}</p>
            {event.reference && <p><span className="text-gray-500">Réf:</span> {event.reference}</p>}
            <p className="mt-2">{event.description}</p>
          </section>
          {(event.beforeState || event.afterState) && (
            <section>
              <h3 className="font-semibold text-gray-500 text-xs uppercase mb-2">Avant / Après</h3>
              {event.beforeState && <pre className="bg-gray-50 p-3 rounded-xl text-xs overflow-x-auto mb-2">{JSON.stringify(event.beforeState, null, 2)}</pre>}
              {event.afterState && <pre className="bg-green-50 p-3 rounded-xl text-xs overflow-x-auto">{JSON.stringify(event.afterState, null, 2)}</pre>}
            </section>
          )}
          {event.corridorsImpacted.length > 0 && (
            <section>
              <h3 className="font-semibold text-gray-500 text-xs uppercase mb-2">Corridors impactés</h3>
              <div className="flex flex-wrap gap-2">
                {event.corridorsImpacted.map((c) => <span key={c} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">{c}</span>)}
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
