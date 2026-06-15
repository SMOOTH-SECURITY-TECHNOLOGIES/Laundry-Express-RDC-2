import { Icon } from '../../Icon';
import { SUPPORT_WRITE_ENABLED } from '../../../lib/admin/support-api';
import type { TicketDetail } from '../../../lib/admin/support-types';

interface Props {
  ticket: TicketDetail | null;
  loading?: boolean;
  onClose: () => void;
  onReply?: (content: string) => void;
  onEscalate?: () => void;
  onResolve?: () => void;
}

export function SupportTicketDrawer({ ticket, loading, onClose, onReply, onEscalate, onResolve }: Props) {
  if (!ticket && !loading) return null;
  const readOnly = !SUPPORT_WRITE_ENABLED;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative w-full max-w-xl bg-white h-full shadow-xl overflow-y-auto">
        {loading ? (
          <div className="p-6 space-y-4 animate-pulse"><div className="h-8 bg-gray-200 rounded w-2/3" /><div className="h-48 bg-gray-100 rounded-xl" /></div>
        ) : ticket && (
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-mono text-purple-600 text-sm">{ticket.ticketCode}</p>
                <h2 className="text-lg font-bold">{ticket.title}</h2>
                <p className="text-xs text-gray-500">{ticket.clientName} • {ticket.channel} • {ticket.categoryLabel}</p>
              </div>
              <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-xs mb-4"><Icon name="sparkles" className="w-4 h-4 text-purple-600 inline mr-1" /><strong>Résumé IA :</strong> {ticket.aiSummary}</div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <Stat label="Priorité" value={ticket.priorityLabel} />
              <Stat label="Statut" value={ticket.statusLabel} />
              <Stat label="SLA" value={ticket.slaLabel} />
              <Stat label="Agent" value={ticket.agentName ?? '—'} />
              <Stat label="Risque remb." value={ticket.refundRisk} />
              <Stat label="Risque churn" value={ticket.churnRisk} />
            </div>
            <h3 className="text-sm font-semibold mb-2">Conversation</h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {ticket.messages.map((m) => (
                <div key={m.id} className={`p-2 rounded-lg text-xs ${m.isInternal ? 'bg-amber-50' : 'bg-gray-50'}`}>{m.content}</div>
              ))}
              {ticket.messages.length === 0 && <p className="text-xs text-gray-400">{ticket.description}</p>}
            </div>
            <h3 className="text-sm font-semibold mb-2">Recommandations IA</h3>
            <ul className="text-xs space-y-1 mb-4">{ticket.aiRecommendations.map((r) => <li key={r} className="text-purple-700">• {r}</li>)}</ul>
            <div className="flex flex-wrap gap-2 mb-4">
              <NavBtn label="Order Truth" />
              <NavBtn label="Payments" />
              <NavBtn label="Refunds" />
              <NavBtn label="Investigate" />
            </div>
            {readOnly && <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl mb-4">Actions sensibles désactivées jusqu&apos;à validation backend.</p>}
            <div className="space-y-2">
              <ActionBtn label="Répondre" disabled={readOnly} onClick={() => onReply?.('Merci pour votre patience, nous traitons votre demande.')} />
              <ActionBtn label="Escalader" disabled={readOnly} onClick={onEscalate} danger />
              <ActionBtn label="Marquer résolu" disabled={readOnly} onClick={onResolve} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="p-2 rounded-lg bg-gray-50"><p className="text-gray-500">{label}</p><p className="font-bold">{value}</p></div>;
}

function NavBtn({ label }: { label: string }) {
  return <button type="button" className="px-3 py-1.5 rounded-lg border text-[10px] font-medium hover:bg-gray-50">{label}</button>;
}

function ActionBtn({ label, danger, disabled, onClick }: { label: string; danger?: boolean; disabled?: boolean; onClick?: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`w-full py-2.5 rounded-xl text-sm font-medium border disabled:opacity-50 ${danger ? 'border-red-200 text-red-700' : ''}`}>{label}</button>;
}
