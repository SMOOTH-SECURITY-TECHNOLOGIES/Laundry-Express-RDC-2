import { Icon } from '../../Icon';
import type { WhatsappConversation, WhatsappConversationDetail } from '../../../lib/admin/whatsapp-types';

export function ConversationDrawer({ conversation, detail, onClose }: {
  conversation: WhatsappConversation | null; detail?: WhatsappConversationDetail | null; onClose: () => void;
}) {
  if (!conversation) return null;
  const messages = detail?.messages ?? [];
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold">{conversation.clientName}</h3>
            <p className="text-sm text-gray-500">{conversation.phone}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><Icon name="xmark" className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{conversation.statusLabel}</span>
            {conversation.assignedTo && <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">Assigné : {conversation.assignedTo}</span>}
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Timeline</h4>
            {messages.length ? messages.map((m, i) => (
              <div key={i} className={`p-3 rounded-xl text-sm ${m.from === 'client' ? 'bg-gray-100 ml-0 mr-8' : 'bg-green-50 ml-8 mr-0'}`}>
                <p className="text-xs text-gray-400 mb-1">{m.from === 'client' ? 'Client' : 'Agent/IA'}</p>
                {m.text}
              </div>
            )) : <p className="text-sm text-gray-400">{conversation.lastMessage}</p>}
          </div>
          {detail?.aiSuggestions?.length ? (
            <div className="bg-emerald-50 rounded-xl p-3">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><Icon name="sparkles" className="w-4 h-4" /> Suggestions IA</h4>
              {detail.aiSuggestions.map((s, i) => <p key={i} className="text-sm">{s}</p>)}
            </div>
          ) : null}
          {detail?.linkedOrders?.length ? (
            <div><h4 className="text-sm font-semibold mb-1">Commandes liées</h4>{detail.linkedOrders.map((o) => <span key={o} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded mr-1">{o}</span>)}</div>
          ) : null}
          {detail?.linkedTickets?.length ? (
            <div><h4 className="text-sm font-semibold mb-1">Tickets liés</h4>{detail.linkedTickets.map((t) => <span key={t} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded mr-1">{t}</span>)}</div>
          ) : null}
          {detail?.internalNotes?.length ? (
            <div className="bg-amber-50 rounded-xl p-3"><h4 className="text-sm font-semibold mb-1">Notes internes</h4>{detail.internalNotes.map((n, i) => <p key={i} className="text-sm">{n}</p>)}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
