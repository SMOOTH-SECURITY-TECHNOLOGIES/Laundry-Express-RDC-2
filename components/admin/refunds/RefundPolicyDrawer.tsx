import React, { useState } from 'react';
import { Icon } from '../../Icon';
import type { CreateRefundPolicyPayload } from '../../../lib/admin/refunds-types';

export function RefundPolicyDrawer({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (payload: CreateRefundPolicyPayload) => Promise<void> }) {
  const [label, setLabel] = useState('');
  const [maxAmount, setMaxAmount] = useState(500);
  const [autoApproveBelow, setAutoApproveBelow] = useState(50);
  const [scope, setScope] = useState('Global');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onCreate({ label: label || `Politique ${scope}`, maxAmount, autoApproveBelow, scope });
      setLabel('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-xl h-full overflow-y-auto border-l dark:border-slate-700">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Nouvelle politique remboursement</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"><Icon name="xmark" className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div><label className="text-xs font-medium text-gray-500 dark:text-slate-400">Libellé</label><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Politique Express" className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-sm" /></div>
          <div><label className="text-xs font-medium text-gray-500 dark:text-slate-400">Montant max ($)</label><input type="number" value={maxAmount} onChange={(e) => setMaxAmount(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-sm" /></div>
          <div><label className="text-xs font-medium text-gray-500 dark:text-slate-400">Auto-approuver sous ($)</label><input type="number" value={autoApproveBelow} onChange={(e) => setAutoApproveBelow(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-sm" /></div>
          <div><label className="text-xs font-medium text-gray-500 dark:text-slate-400">Portée</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-sm">
              {['Global', 'Zone', 'Partenaire', 'Service'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button type="button" onClick={handleSave} disabled={saving} className="w-full py-2.5 rounded-xl bg-[#9333EA] text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50">{saving ? 'Enregistrement…' : 'Créer politique'}</button>
        </div>
      </div>
    </div>
  );
}
