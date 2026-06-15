import { Icon } from '../../Icon';
import type { SmsMessage } from '../../../lib/admin/sms-types';

const statusColors: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700', sent: 'bg-blue-100 text-blue-700', failed: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700', queued: 'bg-gray-100 text-gray-600',
};

export function RecentSendsTable({ messages, onOpen, onAction }: {
  messages: SmsMessage[]; onOpen: (m: SmsMessage) => void; onAction: (a: string, m: SmsMessage) => void;
}) {
  if (!messages.length) return <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">Aucun envoi trouvé.</div>;
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Envois récents</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">Référence</th><th className="px-4 py-3">Destinataire</th><th className="px-4 py-3">Expéditeur</th>
              <th className="px-4 py-3">Type</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Opérateur</th>
              <th className="px-4 py-3">Coût</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{m.reference}</td>
                <td className="px-4 py-3">{m.recipientName || m.phoneNumber}</td>
                <td className="px-4 py-3">{m.senderName}</td>
                <td className="px-4 py-3">{m.messageTypeLabel}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[m.status] || ''}`}>{m.statusLabel}</span></td>
                <td className="px-4 py-3">{m.operatorName}</td>
                <td className="px-4 py-3">{m.cost.toFixed(3)} $</td>
                <td className="px-4 py-3 text-xs text-gray-400">{m.sentAt ? new Date(m.sentAt).toLocaleString('fr-FR') : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button type="button" title="Voir" onClick={() => onOpen(m)} className="p-1 hover:bg-gray-100 rounded"><Icon name="search" className="w-4 h-4" /></button>
                    <button type="button" title="Retry" onClick={() => onAction('retry', m)} className="p-1 hover:bg-gray-100 rounded"><Icon name="arrow-path" className="w-4 h-4" /></button>
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
