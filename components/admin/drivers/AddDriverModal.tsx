import React, { useState, useEffect } from 'react';
import { Icon } from '../../Icon';
import type { AddDriverPayload, VehicleType } from '../../../lib/admin/drivers-types';

const VEHICLES: VehicleType[] = ['Moto', 'Voiture', 'Camionnette'];
const ZONES = ['Gombe', 'Limete', 'Ngaliema', 'Masina', 'Bandalungwa', 'Kalamu'];

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AddDriverPayload) => void;
}

export function AddDriverModal({ isOpen, onClose, onSubmit }: AddDriverModalProps) {
  const [form, setForm] = useState<AddDriverPayload>({ name: '', phone: '', email: '', partner: 'Laundry Express Logistique', vehicle: 'Moto', zone: 'Gombe' });

  useEffect(() => {
    if (isOpen) setForm({ name: '', phone: '', email: '', partner: 'Laundry Express Logistique', vehicle: 'Moto', zone: 'Gombe' });
  }, [isOpen]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) { document.addEventListener('keydown', esc); return () => document.removeEventListener('keydown', esc); }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Ajouter chauffeur</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><Icon name="xmark" className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <Field label="Nom" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Partenaire" value={form.partner} onChange={(v) => setForm({ ...form, partner: v })} />
          <div>
            <label className="text-xs text-gray-500">Véhicule</label>
            <select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value as VehicleType })} className="w-full mt-1 border rounded-xl px-3 py-2 text-sm">
              {VEHICLES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Zone</label>
            <select value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} className="w-full mt-1 border rounded-xl px-3 py-2 text-sm">
              {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <p className="text-[10px] text-gray-400">Documents (Permis, Identité) à uploader après création du profil.</p>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border text-sm">Annuler</button>
          <button type="button" disabled={!form.name.trim() || !form.phone.trim()} onClick={() => onSubmit(form)} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium disabled:opacity-50">Créer chauffeur</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
    </div>
  );
}
