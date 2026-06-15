import React, { useEffect, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { partnerBtnGhost, partnerField, partnerLabel, partnerModalTitle } from '../partner-ui';

export interface NewDeliveryFormValues {
  client: string;
  commune: string;
  driver: string;
  amount: number;
  orderNumber: string;
}

interface NewDeliveryModalProps {
  isOpen: boolean;
  communes: string[];
  drivers: string[];
  onClose: () => void;
  onSave: (values: NewDeliveryFormValues) => void;
}

const defaultValues: NewDeliveryFormValues = {
  client: '',
  commune: 'Gombe',
  driver: '',
  amount: 15,
  orderNumber: '',
};

export const NewDeliveryModal: React.FC<NewDeliveryModalProps> = ({
  isOpen,
  communes,
  drivers,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<NewDeliveryFormValues>(defaultValues);

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...defaultValues,
        commune: communes[0] || 'Gombe',
        driver: drivers[0] || '',
      });
    }
  }, [isOpen, communes, drivers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client.trim() || !form.driver.trim()) return;
    onSave({
      ...form,
      client: form.client.trim(),
      orderNumber: form.orderNumber.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className={partnerModalTitle}>Nouvelle livraison</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-content-muted hover:text-content-primary">
            <Icon name="xmark" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={partnerLabel}>Client *</label>
            <input
              className={partnerField}
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              placeholder="Nom du client"
              required
            />
          </div>
          <div>
            <label className={partnerLabel}>N° commande (optionnel)</label>
            <input
              className={partnerField}
              value={form.orderNumber}
              onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
              placeholder="ORDER-2048"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={partnerLabel}>Commune *</label>
              <select className={partnerField} value={form.commune} onChange={(e) => setForm({ ...form, commune: e.target.value })}>
                {communes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={partnerLabel}>Livreur *</label>
              <select className={partnerField} value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} required>
                {drivers.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={partnerLabel}>Montant ($)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={partnerField}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={partnerBtnGhost}>
            Annuler
          </button>
          <button type="submit" className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-700">
            Creer la livraison
          </button>
        </div>
      </form>
    </div>
  );
};
