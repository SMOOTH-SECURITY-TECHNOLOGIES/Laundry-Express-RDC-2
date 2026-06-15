import React, { useState } from 'react';
import { Icon } from '../../Icon';
import type { SlaRule, CreateSlaRulePayload } from '../../../lib/admin/sla-types';

const RULE_TYPES = ['SLA collecte', 'SLA lavage', 'SLA livraison', 'SLA express', 'SLA nuit', 'SLA entreprise'];
const SCOPES = ['zone', 'service', 'partenaire'];

interface SlaRuleDrawerProps {
  open: boolean;
  rules: SlaRule[];
  onClose: () => void;
  onCreate: (payload: CreateSlaRulePayload) => Promise<void>;
}

export function SlaRuleDrawer({ open, rules, onClose, onCreate }: SlaRuleDrawerProps) {
  const [type, setType] = useState(RULE_TYPES[0]);
  const [scope, setScope] = useState(SCOPES[0]);
  const [minutes, setMinutes] = useState(60);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onCreate({ type, label: label || `${type} — ${scope}`, minutes, scope });
      setLabel('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-xl h-full overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Configuration SLA</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><Icon name="xmark" className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Type de règle</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border text-sm">
              {RULE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Portée</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border text-sm">
              {SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Délai (minutes)</label>
            <input type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl border text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Libellé</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Gombe — livraison express" className="w-full mt-1 px-3 py-2 rounded-xl border text-sm" />
          </div>
          <button type="button" onClick={handleSave} disabled={saving} className="w-full py-2.5 rounded-xl bg-[#9333EA] text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Créer règle SLA'}
          </button>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Règles actives ({rules.length})</h4>
            {rules.map((r) => (
              <div key={r.id} className="flex justify-between text-xs py-2 border-b border-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{r.label}</p>
                  <p className="text-gray-500">{r.type} · {r.scope}</p>
                </div>
                <span className="font-bold text-purple-600">{r.minutes} min</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
