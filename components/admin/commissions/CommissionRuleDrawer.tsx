import React, { useState } from 'react';
import { Icon } from '../../Icon';
import type { CommissionRule, CreateCommissionRulePayload } from '../../../lib/admin/commissions-types';

interface CommissionRuleDrawerProps {
  open: boolean;
  rules: CommissionRule[];
  onClose: () => void;
  onCreate: (payload: CreateCommissionRulePayload) => Promise<void>;
}

export function CommissionRuleDrawer({ open, rules, onClose, onCreate }: CommissionRuleDrawerProps) {
  const [label, setLabel] = useState('');
  const [rate, setRate] = useState(20);
  const [scope, setScope] = useState('Global');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onCreate({ label: label || `Commission ${scope}`, rate, scope });
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Nouvelle règle commission</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"><Icon name="xmark" className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div><label className="text-xs font-medium text-gray-500 dark:text-slate-400">Libellé</label><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Commission Premium" className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-sm" /></div>
          <div><label className="text-xs font-medium text-gray-500 dark:text-slate-400">Taux (%)</label><input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-sm" /></div>
          <div><label className="text-xs font-medium text-gray-500 dark:text-slate-400">Portée</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-sm">
              {['Global', 'Marketplace', 'Logistique', 'Premium', 'Enterprise'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button type="button" onClick={handleSave} disabled={saving} className="w-full py-2.5 rounded-xl bg-[#9333EA] text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50">{saving ? 'Enregistrement…' : 'Créer règle'}</button>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Règles actives ({rules.length})</h4>
            {rules.map((r) => (
              <div key={r.id} className="flex justify-between text-xs py-2 border-b border-gray-50 dark:border-slate-800">
                <div><p className="font-medium text-gray-900 dark:text-slate-100">{r.label}</p><p className="text-gray-500">{r.scope}</p></div>
                <span className="font-bold text-purple-600">{r.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
