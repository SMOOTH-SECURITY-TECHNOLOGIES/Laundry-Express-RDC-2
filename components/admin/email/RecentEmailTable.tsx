import { Icon } from '../../Icon';
import type { EmailMessage } from '../../../lib/admin/email-types';

const statusColors: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700', opened: 'bg-blue-100 text-blue-700', clicked: 'bg-violet-100 text-violet-700',
  sent: 'bg-gray-100 text-gray-600', bounce: 'bg-red-100 text-red-700', failed: 'bg-red-100 text-red-700', unsubscribed: 'bg-pink-100 text-pink-700',
};

export function RecentEmailTable({ messages, onOpen, onAction }: {
  messages: EmailMessage[]; onOpen: (m: EmailMessage) => void; onAction: (a: string, m: EmailMessage) => void;
}) {
  if (!messages.length) return <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">Aucun email trouvé.<br /><span className="text-xs">Connectez un provider email ou créez votre premier template.</span></div>;
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Envois récents</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">Référence</th><th className="px-4 py-3">Destinataire</th><th className="px-4 py-3">Sujet</th>
              <th className="px-4 py-3">Type</th><th className="px-4 py-3">Template</th><th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Ouverture</th><th className="px-4 py-3">Clic</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{m.reference}</td>
                <td className="px-4 py-3">{m.recipientName || m.recipientEmail}</td>
                <td className="px-4 py-3 max-w-[180px] truncate">{m.subject}</td>
                <td className="px-4 py-3">{m.messageTypeLabel}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{m.templateName}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[m.status] || ''}`}>{m.statusLabel}</span></td>
                <td className="px-4 py-3">{m.openRate != null ? `${m.openRate}%` : '—'}</td>
                <td className="px-4 py-3">{m.clickRate != null ? `${m.clickRate}%` : '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{m.sentAt ? new Date(m.sentAt).toLocaleString('fr-FR') : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => onOpen(m)} className="p-1 hover:bg-gray-100 rounded"><Icon name="search" className="w-4 h-4" /></button>
                    <button type="button" onClick={() => onAction('retry', m)} className="p-1 hover:bg-gray-100 rounded"><Icon name="arrow-path" className="w-4 h-4" /></button>
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
