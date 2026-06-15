import type { RbacHistoryItem } from '../../../lib/admin/rbac-types';

export function HistoryTimeline({ items }: { items: RbacHistoryItem[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Historique permissions</h3></div>
      <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
        {items.map((h) => (
          <div key={h.id} className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
            <div>
              <p className="text-sm font-medium">{h.eventLabel}</p>
              <p className="text-xs text-gray-500">{h.actorName}{h.target ? ` · ${h.target}` : ''}</p>
              {h.occurredAt && <p className="text-[10px] text-gray-400 mt-1">{new Date(h.occurredAt).toLocaleString('fr-FR')}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
