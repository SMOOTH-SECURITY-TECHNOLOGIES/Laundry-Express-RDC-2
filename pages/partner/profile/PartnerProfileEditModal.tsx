import React, { useEffect, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { PartnerProfileDetailResponse } from '../../../services/real-api';
import { partnerBtnGhost, partnerField, partnerLabel, partnerModalTitle } from '../partner-ui';

export interface PartnerProfileFormValues {
  name: string;
  address: string;
  city: string;
  commune: string;
}

interface Props {
  open: boolean;
  initial: PartnerProfileFormValues;
  profileDetail?: PartnerProfileDetailResponse | null;
  onClose: () => void;
  onSave: (values: PartnerProfileFormValues) => Promise<void>;
}

export const PartnerProfileEditModal: React.FC<Props> = ({
  open,
  initial,
  profileDetail,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<PartnerProfileFormValues>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} role="presentation" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-2xl border border-surface-border bg-surface-card p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className={partnerModalTitle}>Informations de l&apos;etablissement</h2>
          <button type="button" onClick={onClose} className="text-content-muted hover:text-content-primary" aria-label="Fermer">
            <Icon name="xmark" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={partnerLabel}>Nom commercial *</label>
            <input
              className={partnerField}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={partnerLabel}>Adresse *</label>
            <textarea
              className={`${partnerField} min-h-[72px] resize-y`}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={partnerLabel}>Ville</label>
              <input
                className={partnerField}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Kinshasa"
              />
            </div>
            <div>
              <label className={partnerLabel}>Commune</label>
              <input
                className={partnerField}
                value={form.commune}
                onChange={(e) => setForm({ ...form, commune: e.target.value })}
                placeholder="Gombe"
              />
            </div>
          </div>
          {(profileDetail?.phone || profileDetail?.email) && (
            <div className="rounded-xl bg-surface-muted p-3 text-xs text-content-muted">
              <p className="font-medium text-content-primary">Contact (lecture seule)</p>
              {profileDetail.phone && <p className="mt-1">Tel : {profileDetail.phone}</p>}
              {profileDetail.email && <p>Email : {profileDetail.email}</p>}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={partnerBtnGhost}>Annuler</button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-700 disabled:opacity-60"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
};
