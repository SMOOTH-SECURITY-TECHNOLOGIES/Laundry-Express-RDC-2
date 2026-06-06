import React, { useState, useEffect } from 'react';
import { Icon } from '../Icon';
import { DrcAddress } from '../../types';
import { addressSchema, COMMUNES_RDC } from '../../utils/order-validation';

interface EditAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: DrcAddress) => void;
  currentAddress: DrcAddress;
  userName: string;
  userPhone: string;
}

export const EditAddressModal: React.FC<EditAddressModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentAddress,
  userName,
  userPhone,
}) => {
  const [name, setName] = useState(userName);
  const [phone, setPhone] = useState(userPhone);
  const [avenue, setAvenue] = useState(currentAddress.avenue || '');
  const [commune, setCommune] = useState(currentAddress.commune || '');
  const [city, setCity] = useState('Kinshasa');
  const [instructions, setInstructions] = useState(currentAddress.reference || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setName(userName);
      setPhone(userPhone);
      setAvenue(currentAddress.avenue || '');
      setCommune(currentAddress.commune || '');
      setCity('Kinshasa');
      setInstructions(currentAddress.reference || '');
      setErrors({});
    }
  }, [isOpen, userName, userPhone, currentAddress]);

  const handleSave = () => {
    const result = addressSchema.safeParse({ name, phone, avenue, commune, city });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSave({
      commune,
      avenue,
      numero: currentAddress.numero || '',
      quartier: currentAddress.quartier || '',
      reference: instructions || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 p-5 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Modifier l'adresse</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Icon name="xmark" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Nom complet *
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${errors.name ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'} bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="edit-phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Téléphone *
            </label>
            <input
              id="edit-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+243 XXX XXX XXX"
              className={`w-full px-4 py-2.5 rounded-xl border ${errors.phone ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'} bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors`}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label htmlFor="edit-avenue" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Adresse *
            </label>
            <input
              id="edit-avenue"
              type="text"
              value={avenue}
              onChange={(e) => setAvenue(e.target.value)}
              placeholder="22, Avenue de l'Equateur"
              className={`w-full px-4 py-2.5 rounded-xl border ${errors.avenue ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'} bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors`}
            />
            {errors.avenue && <p className="text-xs text-red-500 mt-1">{errors.avenue}</p>}
          </div>

          <div>
            <label htmlFor="edit-commune" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Commune *
            </label>
            <select
              id="edit-commune"
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${errors.commune ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'} bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors`}
            >
              <option value="">Sélectionnez une commune</option>
              {COMMUNES_RDC.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.commune && <p className="text-xs text-red-500 mt-1">{errors.commune}</p>}
          </div>

          <div>
            <label htmlFor="edit-city" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Ville *
            </label>
            <input
              id="edit-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${errors.city ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'} bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors`}
            />
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </div>

          <div>
            <label htmlFor="edit-instructions" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Instructions adresse
            </label>
            <textarea
              id="edit-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder="Ex: portail noir, 2e étage..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors resize-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 p-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-700 text-white font-semibold transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};
