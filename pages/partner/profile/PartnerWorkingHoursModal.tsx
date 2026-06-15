import React, { useEffect, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { DayWorkingHours, WorkingHours } from '../../../types';
import { partnerBtnGhost, partnerField, partnerLabel, partnerModalTitle } from '../partner-ui';

type DayKey = keyof WorkingHours;

const dayNames: Record<DayKey, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

const dayOrder: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface Props {
  open: boolean;
  initial: WorkingHours;
  onClose: () => void;
  onSave: (hours: WorkingHours) => Promise<void>;
}

export const PartnerWorkingHoursModal: React.FC<Props> = ({ open, initial, onClose, onSave }) => {
  const [hours, setHours] = useState<WorkingHours>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setHours(initial);
  }, [open, initial]);

  if (!open) return null;

  const updateDay = (day: DayKey, patch: Partial<DayWorkingHours>) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(hours);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} role="presentation" />
      <form
        onSubmit={handleSubmit}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-border bg-surface-card p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className={partnerModalTitle}>Horaires d&apos;ouverture</h2>
          <button type="button" onClick={onClose} className="text-content-muted hover:text-content-primary" aria-label="Fermer">
            <Icon name="xmark" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          {dayOrder.map((day) => {
            const entry = hours[day];
            return (
              <div key={day} className="rounded-xl border border-surface-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-content-primary">{dayNames[day]}</span>
                  <label className="flex items-center gap-2 text-xs text-content-muted">
                    <input
                      type="checkbox"
                      checked={entry.isClosed}
                      onChange={(e) => updateDay(day, { isClosed: e.target.checked })}
                    />
                    Ferme
                  </label>
                </div>
                {!entry.isClosed && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={partnerLabel}>Ouverture</label>
                      <input
                        type="time"
                        className={partnerField}
                        value={entry.open}
                        onChange={(e) => updateDay(day, { open: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={partnerLabel}>Fermeture</label>
                      <input
                        type="time"
                        className={partnerField}
                        value={entry.close}
                        onChange={(e) => updateDay(day, { close: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
