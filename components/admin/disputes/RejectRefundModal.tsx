import { useState } from 'react';
import type { DisputeRequest } from '../../../lib/admin/disputes-types';
import { Icon } from '../../Icon';

interface RejectRefundModalProps {
  isOpen: boolean;
  dispute: DisputeRequest | null;
  onClose: () => void;
  onSubmit: (data: RejectRefundFormData) => void;
}

export interface RejectRefundFormData {
  reason: string;
  internalNote: string;
  clientMessage: string;
}

export function RejectRefundModal({ isOpen, dispute, onClose, onSubmit }: RejectRefundModalProps) {
  const [form, setForm] = useState<RejectRefundFormData>({
    reason: '',
    internalNote: '',
    clientMessage: '',
  });

  if (!isOpen || !dispute) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    setForm({ reason: '', internalNote: '', clientMessage: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <Icon name="xmark" className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Rejeter la demande</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <Icon name="xmark" className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500">Commande</span>
              <p className="text-sm font-semibold text-gray-800">{dispute.orderId}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">Montant</span>
              <p className="text-sm font-semibold text-gray-800">${dispute.amount.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Motif du rejet *</label>
            <select
              required
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Sélectionner un motif</option>
              <option value="insufficient_evidence">Preuves insuffisantes</option>
              <option value="not_eligible">Non éligible au remboursement</option>
              <option value="fraud_suspected">Fraude suspectée</option>
              <option value="already_resolved">Déjà résolu</option>
              <option value="outside_policy">Hors politique</option>
              <option value="duplicate">Doublon</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Note interne</label>
            <textarea
              rows={3}
              value={form.internalNote}
              onChange={(e) => setForm({ ...form, internalNote: e.target.value })}
              placeholder="Détails internes (non visible par le client)..."
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Message au client *</label>
            <textarea
              required
              rows={3}
              value={form.clientMessage}
              onChange={(e) => setForm({ ...form, clientMessage: e.target.value })}
              placeholder="Message qui sera envoyé au client..."
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <span className="text-xs text-gray-400">
              Ce message sera envoyé au client par notification
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Confirmer le rejet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
