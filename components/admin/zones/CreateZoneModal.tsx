import React, { useState, useEffect } from 'react';
import { Icon } from '../../Icon';
import type { CreateZonePayload } from '../../../lib/admin/zones-types';

const COMMUNES = ['Gombe', 'Limete', 'Ngaliema', 'Masina', 'Bandalungwa', 'Kalamu', 'Kintambo', 'Lingwala', 'Matete', 'Kimbanseke'];

export function CreateZoneModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (p: CreateZonePayload) => void }) {
  const [form, setForm] = useState<CreateZonePayload>({ name: '', commune: 'Gombe', code: '', baseTariff: 3 });

  useEffect(() => {
    if (isOpen) setForm({ name: '', commune: 'Gombe', code: '', baseTariff: 3 });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Créer zone</h2>
          <button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <Field label="Nom zone" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <div>
            <label className="text-xs text-gray-500">Commune</label>
            <select value={form.commune} onChange={(e) => setForm({ ...form, commune: e.target.value })} className="w-full mt-1 border rounded-xl px-3 py-2 text-sm">
              {COMMUNES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Field label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v.toUpperCase() })} />
          <Field label="Tarif base ($)" value={String(form.baseTariff)} onChange={(v) => setForm({ ...form, baseTariff: parseFloat(v) || 0 })} />
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border text-sm">Annuler</button>
          <button type="button" disabled={!form.name || !form.code} onClick={() => onSubmit(form)} className="px-4 py-2 rounded-xl bg-[#9333EA] text-white text-sm font-medium disabled:opacity-50">Créer</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500" />
    </div>
  );
}
