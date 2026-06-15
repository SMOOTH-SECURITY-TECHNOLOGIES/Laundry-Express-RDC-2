import React, { useState } from 'react';
import { Icon } from '../../Icon';

interface AuditRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRun: (type: string) => void;
}

const auditOptions = [
  { id: 'orders', icon: 'shoppingBag' as const, label: 'Audit commandes', description: 'Vérifie l\'intégrité des commandes, doublons et incohérences.' },
  { id: 'payments', icon: 'currencyDollar' as const, label: 'Audit paiements', description: 'Détecte les paiements orphelins et remboursements suspects.' },
  { id: 'logistics', icon: 'truck' as const, label: 'Audit logistique', description: 'Analyse les retards, routes et collectes hors SLA.' },
  { id: 'marketplace', icon: 'building' as const, label: 'Audit marketplace', description: 'Contrôle les annonces, prix et commissions marketplace.' },
  { id: 'full', icon: 'shield-check' as const, label: 'Audit complet', description: 'Lance les 4 audits en séquence complète.' },
];

export const AuditRunModal: React.FC<AuditRunModalProps> = ({ isOpen, onClose, onRun }) => {
  const [selected, setSelected] = useState('orders');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Lancer un audit</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <Icon name="xmark" className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {auditOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                selected === opt.id
                  ? 'border-brand-blue bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                selected === opt.id ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <Icon name={opt.icon} className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-gray-900">{opt.label}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selected === opt.id ? 'border-brand-blue' : 'border-gray-300'
              }`}>
                {selected === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-brand-blue" />}
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={() => onRun(selected)} className="px-4 py-2 rounded-xl bg-brand-blue text-white text-sm font-semibold hover:bg-blue-600 flex items-center gap-2">
            <Icon name="play" className="w-4 h-4" /> Lancer l'audit
          </button>
        </div>
      </div>
    </div>
  );
};
