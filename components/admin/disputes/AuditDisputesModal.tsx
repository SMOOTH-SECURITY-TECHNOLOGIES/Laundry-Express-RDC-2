import { useState } from 'react';
import type { AuditDisputesPayload } from '../../../lib/admin/disputes-types';
import { Icon } from '../../Icon';

interface AuditDisputesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AuditDisputesPayload) => void;
}

export function AuditDisputesModal({ isOpen, onClose, onSubmit }: AuditDisputesModalProps) {
  const [options, setOptions] = useState<AuditDisputesPayload>({
    auditPayments: false,
    auditQuality: false,
    auditSla: false,
    auditRefunds: false,
    auditFull: false,
  });

  if (!isOpen) return null;

  const toggle = (key: keyof AuditDisputesPayload) => {
    if (key === 'auditFull') {
      const full = !options.auditFull;
      setOptions({
        auditPayments: full,
        auditQuality: full,
        auditSla: full,
        auditRefunds: full,
        auditFull: full,
      });
      return;
    }
    setOptions((prev) => ({ ...prev, [key]: !prev[key], auditFull: false }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(options);
    onClose();
  };

  const auditItems = [
    { key: 'auditPayments' as const, label: 'Audit paiements', desc: 'Vérifier cohérence des flux de paiement' },
    { key: 'auditQuality' as const, label: 'Audit qualité', desc: 'Analyser les litiges qualité récurrents' },
    { key: 'auditSla' as const, label: 'Audit SLA', desc: 'Contrôler les délais de traitement' },
    { key: 'auditRefunds' as const, label: 'Audit remboursements', desc: 'Valider les remboursements approuvés' },
    { key: 'auditFull' as const, label: 'Audit complet', desc: 'Lancer un audit exhaustif de tous les litiges' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <Icon name="shield-check" className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Auditer les litiges</h2>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <Icon name="xmark" className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
          {auditItems.map((item) => (
            <label
              key={item.key}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                options[item.key] ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={options[item.key]}
                onChange={() => toggle(item.key)}
                className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">{item.label}</span>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </label>
          ))}

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
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Lancer l&apos;audit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
