import { useState } from 'react';
import type { DisputeRequest } from '../../../lib/admin/disputes-types';
import { Icon } from '../../Icon';

interface ApproveRefundModalProps {
  isOpen: boolean;
  dispute: DisputeRequest | null;
  onClose: () => void;
  onSubmit: (data: ApproveRefundFormData) => void;
}

export interface ApproveRefundFormData {
  approvedAmount: number;
  method: 'cash' | 'mobile_money' | 'card' | 'bank_transfer' | 'wallet';
  note: string;
}

const paymentMethods = [
  { value: 'mobile_money' as const, label: 'Mobile Money', icon: 'device-phone-mobile' as const },
  { value: 'cash' as const, label: 'Espèces', icon: 'currencyDollar' as const },
  { value: 'card' as const, label: 'Carte', icon: 'credit-card' as const },
  { value: 'bank_transfer' as const, label: 'Virement', icon: 'building' as const },
  { value: 'wallet' as const, label: 'Portefeuille', icon: 'wallet' as const },
];

export function ApproveRefundModal({ isOpen, dispute, onClose, onSubmit }: ApproveRefundModalProps) {
  const [form, setForm] = useState<ApproveRefundFormData>({
    approvedAmount: dispute?.amount || 0,
    method: 'mobile_money',
    note: '',
  });

  if (!isOpen || !dispute) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    setForm({ approvedAmount: dispute.amount, method: 'mobile_money', note: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Icon name="check" className="w-4 h-4 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Approuver le remboursement</h2>
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
              <span className="text-xs text-gray-500">Montant demandé</span>
              <p className="text-sm font-semibold text-gray-800">${dispute.amount.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Montant approuvé ($)</label>
            <input
              type="number"
              required
              min={0}
              max={dispute.amount}
              step={0.01}
              value={form.approvedAmount}
              onChange={(e) => setForm({ ...form, approvedAmount: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <span className="text-xs text-gray-400">
              Maximum: ${dispute.amount.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Mode de remboursement</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setForm({ ...form, method: pm.value })}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                    form.method === pm.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Icon name={pm.icon} className="w-5 h-5" />
                  <span className="text-xs font-medium">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Note</label>
            <textarea
              rows={2}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Note interne optionnelle..."
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
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
              className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Confirmer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
