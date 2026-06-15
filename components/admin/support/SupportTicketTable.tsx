import { Icon } from '../../Icon';
import type { SupportTicket } from '../../../lib/admin/support-types';

const PRIO: Record<string, string> = { Low: 'bg-gray-100 text-gray-700', Medium: 'bg-blue-100 text-blue-700', High: 'bg-orange-100 text-orange-700', Critical: 'bg-red-100 text-red-700' };
const STAT: Record<string, string> = { Nouveau: 'bg-purple-100 text-purple-700', Ouvert: 'bg-green-100 text-green-700', 'En cours': 'bg-yellow-100 text-yellow-700', Escaladé: 'bg-red-100 text-red-700', Résolu: 'bg-gray-100 text-gray-600' };
const SLA: Record<string, string> = { within: 'text-green-600', at_risk: 'text-orange-600', breached: 'text-red-600' };

export function SupportTicketTable({ tickets, onView }: { tickets: SupportTicket[]; onView: (t: SupportTicket) => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b"><h3 className="text-sm font-semibold">Tous les tickets ({tickets.length})</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-4 py-3">Ticket ID</th>
              <th className="text-left px-4 py-3">Sujet / Résumé IA</th>
              <th className="text-left px-4 py-3">Client</th>
              <th className="text-left px-4 py-3">Catégorie</th>
              <th className="text-left px-4 py-3">Priorité</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">SLA</th>
              <th className="text-left px-4 py-3">Dernière MAJ</th>
              <th className="text-left px-4 py-3">Agent</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono text-purple-600">{t.ticketCode}</td>
                <td className="px-4 py-3"><p className="font-medium">{t.title}</p><p className="text-gray-400 italic mt-0.5">{t.aiSummary}</p></td>
                <td className="px-4 py-3">{t.clientName}</td>
                <td className="px-4 py-3">{t.categoryLabel}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${PRIO[t.priorityLabel] ?? ''}`}>{t.priorityLabel}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STAT[t.statusLabel] ?? 'bg-gray-100'}`}>{t.statusLabel}</span></td>
                <td className={`px-4 py-3 font-medium ${SLA[t.slaStatus] ?? ''}`}>{t.slaLabel}</td>
                <td className="px-4 py-3 text-gray-500">{t.updatedAt ? new Date(t.updatedAt).toLocaleString('fr-FR') : '—'}</td>
                <td className="px-4 py-3">{t.agentName}</td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1"><button type="button" title="Voir" onClick={() => onView(t)} className="p-1.5 rounded-lg hover:bg-gray-100"><Icon name="search" className="w-3.5 h-3.5" /></button><button type="button" className="p-1.5 rounded-lg hover:bg-gray-100"><Icon name="pencil" className="w-3.5 h-3.5" /></button><button type="button" className="p-1.5 rounded-lg hover:bg-gray-100"><Icon name="share" className="w-3.5 h-3.5" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
