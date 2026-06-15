import { Icon } from '../../Icon';

export function EscalationCenter({ items }: { items: Array<{ reason: string; severity: string; claim_id?: string }> }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Escalation Center</h3>
      {items.length === 0 ? <p className="text-sm text-gray-400">Aucune escalade récente.</p> : (
        <ul className="space-y-2">
          {items.map((e, i) => (
            <li key={i} className="flex items-center gap-3 p-2 rounded-lg bg-red-50 border border-red-100">
              <Icon name="warning" className="w-4 h-4 text-red-600 shrink-0" />
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{e.reason}</p><p className="text-xs text-gray-500">{e.severity}{e.claim_id ? ` • ${e.claim_id.slice(0, 8)}` : ''}</p></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
