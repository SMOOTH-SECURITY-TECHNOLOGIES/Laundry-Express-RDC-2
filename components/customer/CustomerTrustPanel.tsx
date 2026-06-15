import React, { useMemo, useState } from 'react';
import { Icon } from '../Icon';
import { useCustomerTrust } from '../../hooks/useCustomerTrust';
import { formatSupportStatus } from '../../utils/support-mappers';
import { useAppContext } from '../../context/AppContext';

type RequestType = 'ticket' | 'claim';

export const CustomerTrustPanel: React.FC = () => {
  const { user, orderHistory, setCurrentPage, addNotification } = useAppContext();
  const {
    tickets,
    claims,
    selectedTicket,
    selectedClaim,
    isLoading,
    error,
    openTicket,
    openClaim,
    createTicket,
    createClaim,
    replyTicket,
    attachProof,
    setSelectedTicket,
    setSelectedClaim,
  } = useCustomerTrust(!!user);

  const [showCreate, setShowCreate] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>('ticket');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState('');
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userOrders = useMemo(
    () => orderHistory.filter((order) => order.userId === user?.id),
    [orderHistory, user?.id],
  );

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      if (requestType === 'ticket') {
        const created = await createTicket({
          title: title.trim(),
          description: description.trim(),
          category: 'order',
          order_id: orderId || undefined,
        });
        await openTicket(created.id);
        addNotification('Votre demande a été transmise au support.', 'success');
      } else {
        const created = await createClaim({
          title: title.trim(),
          description: description.trim(),
          type: 'quality',
          order_id: orderId || undefined,
        });
        await openClaim(created.id);
        addNotification('Votre réclamation a été enregistrée.', 'success');
      }
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setOrderId('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de créer la demande';
      addNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    setIsSubmitting(true);
    try {
      await replyTicket(selectedTicket.id, reply.trim());
      setReply('');
      addNotification('Message envoyé au support.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Envoi impossible';
      addNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttach = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!selectedTicket || !file) return;
    setIsSubmitting(true);
    try {
      await attachProof(selectedTicket.id, file);
      addNotification('Preuve jointe avec succès.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de joindre la preuve';
      addNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
      event.target.value = '';
    }
  };

  if (selectedClaim) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <button type="button" onClick={() => setSelectedClaim(null)} className="text-sm text-brand-blue font-medium">
          ← Retour à mes demandes
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400">{selectedClaim.claim_number}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF7A00]">
            {formatSupportStatus(selectedClaim.status)}
          </span>
        </div>
        <h2 className="text-lg font-bold text-[#0F172A]">{selectedClaim.title}</h2>
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedClaim.description}</p>
        {selectedClaim.order_number && (
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-[#0F172A]">Commande liée</p>
            <p className="text-slate-600">{selectedClaim.order_number}</p>
            {selectedClaim.payment_status && (
              <p className="text-slate-500 text-xs mt-1">Paiement : {selectedClaim.payment_status}</p>
            )}
            <button
              type="button"
              onClick={() => setCurrentPage({ name: 'tracking' })}
              className="mt-2 text-xs font-bold text-brand-blue"
            >
              Voir le suivi commande
            </button>
          </div>
        )}
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <button type="button" onClick={() => setSelectedTicket(null)} className="text-sm text-brand-blue font-medium">
          ← Retour à mes demandes
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400">{selectedTicket.id.slice(0, 8)}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF7A00]">
            {formatSupportStatus(selectedTicket.status)}
          </span>
        </div>
        <h2 className="text-lg font-bold text-[#0F172A]">{selectedTicket.title}</h2>

        {selectedTicket.order_number && (
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-[#0F172A]">Commande liée</p>
            <p className="text-slate-600">{selectedTicket.order_number}</p>
            {selectedTicket.payment_status && (
              <p className="text-slate-500 text-xs mt-1">Paiement : {selectedTicket.payment_status}</p>
            )}
            <button
              type="button"
              onClick={() => setCurrentPage({ name: 'tracking' })}
              className="mt-2 text-xs font-bold text-brand-blue"
            >
              Voir le suivi commande
            </button>
          </div>
        )}

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {(selectedTicket.messages || []).map((message) => (
            <div key={message.id} className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] text-slate-400 mb-1">
                {new Date(message.created_at).toLocaleString('fr-FR')}
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
        </div>

        {(selectedTicket.attachments || []).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Preuves jointes</p>
            {selectedTicket.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-brand-blue"
              >
                <Icon name="document-text" className="w-4 h-4" />
                {attachment.file_name || 'Preuve'}
              </a>
            ))}
          </div>
        )}

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            rows={3}
            placeholder="Répondre au support..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isSubmitting || !reply.trim()}
              onClick={handleReply}
              className="px-4 py-2 bg-brand-blue text-white text-sm font-bold rounded-xl disabled:opacity-50"
            >
              Envoyer
            </button>
            <label className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl cursor-pointer">
              Joindre preuve
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleAttach} />
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#0F172A]">Mes demandes</h2>
          <p className="text-[10px] text-slate-400">Tickets et réclamations liés à vos commandes</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((value) => !value)}
          className="px-3 py-1.5 text-[10px] font-bold bg-brand-blue text-white rounded-lg"
        >
          Créer une demande
        </button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-100 p-4 space-y-3 bg-slate-50">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRequestType('ticket')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${requestType === 'ticket' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600'}`}
            >
              Ticket support
            </button>
            <button
              type="button"
              onClick={() => setRequestType('claim')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${requestType === 'claim' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600'}`}
            >
              Réclamation
            </button>
          </div>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Sujet"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Décrivez le problème"
            rows={4}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
          <select
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
          >
            <option value="">Sans commande liée</option>
            {userOrders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.backendOrderNumber || order.id.slice(0, 8)} — {order.partner?.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-brand-blue text-white text-sm font-bold rounded-xl disabled:opacity-50"
          >
            {isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Chargement de vos demandes...</p>
      ) : (
        <div className="space-y-2">
          {tickets.length === 0 && claims.length === 0 && (
            <p className="text-sm text-slate-500">Aucune demande pour le moment.</p>
          )}

          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => openTicket(ticket.id)}
              className="w-full text-left p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-slate-400">Ticket</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF7A00]">
                  {formatSupportStatus(ticket.status)}
                </span>
              </div>
              <p className="text-xs font-bold text-[#0F172A]">{ticket.title}</p>
              {ticket.order_number && (
                <p className="text-[10px] text-slate-400 mt-1">Commande {ticket.order_number}</p>
              )}
            </button>
          ))}

          {claims.map((claim) => (
            <button
              key={claim.id}
              type="button"
              onClick={() => openClaim(claim.id)}
              className="w-full text-left p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-slate-400">{claim.claim_number}</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                  {formatSupportStatus(claim.status)}
                </span>
              </div>
              <p className="text-xs font-bold text-[#0F172A]">{claim.title}</p>
              {claim.order_number && (
                <p className="text-[10px] text-slate-400 mt-1">Commande {claim.order_number}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
