import { useState } from 'react';
import type { DisputeType } from '../../../lib/admin/disputes-types';
import { Icon } from '../../Icon';

interface CreateDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDisputeFormData) => void;
}

export interface CreateDisputeFormData {
  orderId: string;
  clientName: string;
  type: DisputeType;
  amount: number;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const disputeTypes: { value: DisputeType; label: string }[] = [
  { value: 'quality', label: 'Qualité' },
  { value: 'delay', label: 'Retard' },
  { value: 'cancellation', label: 'Annulation' },
  { value: 'missing_item', label: 'Article manquant' },
  { value: 'payment', label: 'Paiement' },
  { value: 'damaged_item', label: 'Article endommagé' },
  { value: 'duplicate_payment', label: 'Double paiement' },
  { value: 'other', label: 'Autre' },
];

const priorities = [
  { value: 'low' as const, label: 'Faible', color: 'bg-gray-100 text-gray-600' },
  { value: 'medium' as const, label: 'Moyen', color: 'bg-amber-100 text-amber-600' },
  { value: 'high' as const, label: 'Élevé', color: 'bg-orange-100 text-orange-600' },
  { value: 'critical' as const, label: 'Critique', color: 'bg-red-100 text-red-600' },
];

export function CreateDisputeModal({ isOpen, onClose, onSubmit }: CreateDisputeModalProps) {
  const [form, setForm] = useState<CreateDisputeFormData>({
    orderId: '',
    clientName: '',
    type: 'quality',
    amount: 0,
    reason: '',
    priority: 'medium',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    setForm({ orderId: '', clientName: '', type: 'quality', amount: 0, reason: '', priority: 'medium' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Icon name="plus" className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Nouveau litige</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <Icon name="xmark" className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">N° Commande</label>
              <input
                type="text"
                required
                value={form.orderId}
                onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                placeholder="ORD-001"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Client</label>
              <input
                type="text"
                required
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                placeholder="Nom du client"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Type de litige</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as DisputeType })}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {disputeTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Montant ($)</label>
              <input
                type="number"
                required
                min={0}
                step={0.01}
                value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Priorité</label>
              <div className="flex gap-1.5">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p.value })}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      form.priority === p.value ? p.color : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Motif</label>
            <textarea
              required
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Décrivez le motif du litige..."
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
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
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Créer le litige
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
