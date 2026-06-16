import React, { useState, useEffect } from 'react';
import { Icon } from '../Icon';

interface DriverData {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  vehicle: string;
  vehiclePlate: string;
  commune: string;
  email: string;
  notes: string;
  status: string;
  missionsCompleted: number;
  rating: number;
  availability: string;
}

interface EditDriverModalProps {
  isOpen: boolean;
  driver: DriverData | null;
  onClose: () => void;
  onSave: (driver: DriverData) => void;
}

const VEHICLE_OPTIONS = ['Moto', 'Voiture', 'Camionnette'];
const STATUS_OPTIONS = ['Disponible', 'Occupé', 'Pause', 'Hors ligne'];
const COMMUNE_OPTIONS = [
  'Gombe', 'Lingwala', 'Barumbu', 'Kinshasa', 'Ngiri-Ngiri',
  'Bandalungwa', 'Kalamu', 'Matete', 'Limete', 'Ngaliema',
  'Kimbanseke', 'Masina', 'Nsele', 'Mont-Ngafula',
];

export const EditDriverModal: React.FC<EditDriverModalProps> = ({ isOpen, driver, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<DriverData>>({});

  useEffect(() => {
    if (driver) {
      setForm({ ...driver });
    }
  }, [driver]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleChange = (field: keyof DriverData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form || !form.name?.trim() || !form.phone?.trim()) return;
    onSave(form as DriverData);
  };

  if (!isOpen || !driver) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-brand-dark">Modifier le chauffeur</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <Icon name="xmark" className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nom complet <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone <span className="text-red-500">*</span></label>
            <input
              type="tel"
              value={form.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Photo URL (optionnel)</label>
            <input
              type="url"
              value={form.avatarUrl || ''}
              onChange={(e) => handleChange('avatarUrl', e.target.value)}
              placeholder="Ex: /images/drivers/driver-1.svg"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Véhicule</label>
            <select
              value={form.vehicle || 'Moto'}
              onChange={(e) => handleChange('vehicle', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white"
            >
              {VEHICLE_OPTIONS.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Immatriculation</label>
            <input
              type="text"
              value={form.vehiclePlate || ''}
              onChange={(e) => handleChange('vehiclePlate', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Commune</label>
            <select
              value={form.commune || ''}
              onChange={(e) => handleChange('commune', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white"
            >
              <option value="">Sélectionner une commune</option>
              {COMMUNE_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email (optionnel)</label>
            <input
              type="email"
              value={form.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Statut</label>
            <select
              value={form.status || 'Disponible'}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes (optionnel)</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue resize-none"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name?.trim() || !form.phone?.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-blue text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-blue/90"
          >
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDriverModal;
