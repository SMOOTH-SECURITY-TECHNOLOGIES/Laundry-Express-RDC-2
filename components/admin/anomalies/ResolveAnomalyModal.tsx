import React, { useState } from 'react';
import { Icon } from '../../Icon';
import type { ResolveAnomalyPayload } from '../../../lib/admin/anomalies-types';

interface ResolveAnomalyModalProps {
  isOpen: boolean;
  anomalyId: string | null;
  onClose: () => void;
  onSubmit: (id: string, payload: ResolveAnomalyPayload) => void;
}

export const ResolveAnomalyModal: React.FC<ResolveAnomalyModalProps> = ({
  isOpen,
  anomalyId,
  onClose,
  onSubmit,
}) => {
  const [rootCause, setRootCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen || !anomalyId) return null;

  const handleSubmit = () => {
    if (!rootCause || !correctiveAction || !confirmed) return;
    onSubmit(anomalyId, { rootCause, correctiveAction, note });
    setRootCause('');
    setCorrectiveAction('');
    setNote('');
    setConfirmed(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Résoudre l'anomalie</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <Icon name="xmark" className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cause racine *</label>
            <input type="text" value={rootCause} onChange={e => setRootCause(e.target.value)} placeholder="Description de la cause racine..." className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Action corrective *</label>
            <input type="text" value={correctiveAction} onChange={e => setCorrectiveAction(e.target.value)} placeholder="Mesure corrective prise..." className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Informations complémentaires..." className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500" />
            <span className="text-sm text-gray-700">Je confirme que l'anomalie a été traitée et résolue</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={!rootCause || !correctiveAction || !confirmed} className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
            Résoudre
          </button>
        </div>
      </div>
    </div>
  );
};
