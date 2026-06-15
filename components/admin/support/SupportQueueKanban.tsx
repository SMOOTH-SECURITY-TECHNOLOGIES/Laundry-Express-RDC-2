import type { QueueColumn } from '../../../lib/admin/support-types';

const PRIO_DOT: Record<string, string> = { Critical: 'bg-red-500', High: 'bg-orange-500', Medium: 'bg-blue-500', Low: 'bg-gray-400' };

export function SupportQueueKanban({ queue }: { queue: QueueColumn[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <h3 className="text-sm font-semibold mb-4">File d&apos;attente par statut</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {queue.map((col) => (
          <div key={col.status} className="min-w-[160px] flex-1 bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold mb-2">{col.statusLabel} ({col.tickets.length})</p>
            <div className="space-y-2">
              {col.tickets.map((t) => (
                <div key={t.id} className="bg-white rounded-lg border p-2 text-[10px]">
                  <div className="flex items-center gap-1 mb-1"><span className={`w-1.5 h-1.5 rounded-full ${PRIO_DOT[t.priorityLabel] ?? 'bg-gray-400'}`} /><span className="font-mono text-purple-600">{t.ticketCode}</span></div>
                  <p className="font-medium truncate">{t.clientName}</p>
                  <p className="text-gray-500 truncate">{t.title}</p>
                  <p className="text-gray-400 mt-1">{t.slaLabel}</p>
                </div>
              ))}
              {col.tickets.length === 0 && <p className="text-gray-400 text-[10px]">Aucun ticket</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
