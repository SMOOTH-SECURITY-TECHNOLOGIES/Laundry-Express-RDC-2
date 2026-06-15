import React, { useState } from 'react';
import { Icon } from '../../Icon';
import type { CreateInvestigationPayload, AnomalySeverity } from '../../../lib/admin/anomalies-types';

interface CreateInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateInvestigationPayload) => void;
}

export const CreateInvestigationModal: React.FC<CreateInvestigationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState('');
  const [reference, setReference] = useState('');
  const [severity, setSeverity] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!type || !reference || !severity) return;
    onSubmit({ type, reference, severity: severity as AnomalySeverity, assignTo: assignedTo, priority, note });
    setType('');
    setReference('');
    setSeverity('');
    setAssignedTo('');
    setPriority('');
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Créer une investigation</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <Icon name="xmark" className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Type d'anomalie</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue">
              <option value="">Sélectionner...</option>
              <option value="orphan_payment">Paiement orphelin</option>
              <option value="no_proof">Commande sans preuve</option>
              <option value="no_driver">Collecte sans chauffeur</option>
              <option value="double_refund">Double remboursement</option>
              <option value="late_delivery">Livraison hors SLA</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Référence</label>
            <input type="text" value={reference} onChange={e => setReference(e.target.value)} placeholder="CMD-00123..." className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Sévérité</label>
              <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue">
                <option value="">Sélectionner...</option>
                <option value="critical">Critique</option>
                <option value="major">Majeure</option>
                <option value="medium">Moyen</option>
                <option value="minor">Faible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Priorité</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue">
                <option value="">Sélectionner...</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Assigné à</label>
            <input type="text" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="Nom de l'agent..." className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Description ou contexte..." className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={!type || !reference || !severity} className="px-4 py-2 rounded-xl bg-brand-blue text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
            Créer
          </button>
        </div>
      </div>
    </div>
  );
};
