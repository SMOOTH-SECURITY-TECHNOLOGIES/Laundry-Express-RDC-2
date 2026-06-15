import { Icon } from '../../Icon';
import type { WhatsappConversation } from '../../../lib/admin/whatsapp-types';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700', open: 'bg-green-100 text-green-700', ai: 'bg-emerald-100 text-emerald-700',
  waiting_client: 'bg-amber-100 text-amber-700', resolved: 'bg-gray-100 text-gray-600', escalated: 'bg-red-100 text-red-700',
};

export function ConversationTable({ conversations, onOpen, onAction }: {
  conversations: WhatsappConversation[]; onOpen: (c: WhatsappConversation) => void; onAction: (action: string, c: WhatsappConversation) => void;
}) {
  if (!conversations.length) return <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">Aucune conversation trouvée.</div>;
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Conversations récentes</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">Client</th><th className="px-4 py-3">Téléphone</th><th className="px-4 py-3">Dernier message</th>
              <th className="px-4 py-3">Canal</th><th className="px-4 py-3">Assigné à</th><th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Temps attente</th><th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.clientName}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                <td className="px-4 py-3 max-w-[200px] truncate">{c.lastMessage}</td>
                <td className="px-4 py-3"><Icon name="whatsapp" className="w-4 h-4 text-green-600" /></td>
                <td className="px-4 py-3">{c.assignedTo || '—'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status] || 'bg-gray-100'}`}>{c.statusLabel}</span></td>
                <td className="px-4 py-3">{c.waitTimeLabel || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button type="button" title="Ouvrir" onClick={() => onOpen(c)} className="p-1 hover:bg-gray-100 rounded"><Icon name="chatBubble" className="w-4 h-4" /></button>
                    <button type="button" title="Assigner" onClick={() => onAction('assign', c)} className="p-1 hover:bg-gray-100 rounded"><Icon name="user" className="w-4 h-4" /></button>
                    <button type="button" title="Répondre" onClick={() => onAction('reply', c)} className="p-1 hover:bg-gray-100 rounded"><Icon name="paper-plane" className="w-4 h-4" /></button>
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
