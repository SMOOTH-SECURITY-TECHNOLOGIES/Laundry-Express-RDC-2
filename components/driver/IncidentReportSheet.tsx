import React, { useState } from 'react';
import { Icon } from '../Icon';
import { BottomSheet } from '../ui/BottomSheet';
import { MobileButton } from '../ui/MobileButton';
import { CARD, TYPO, SPACING } from '../ui/tokens';

type IncidentType = 'traffic' | 'accident' | 'vehicle' | 'customer' | 'address' | 'other';

interface IncidentReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: IncidentType, description: string, photo?: File) => void;
  isSubmitting: boolean;
}

const INCIDENT_TYPES: { key: IncidentType; label: string; icon: string }[] = [
  { key: 'traffic', label: 'Embouteillage', icon: 'warning' },
  { key: 'accident', label: 'Accident', icon: 'exclamation-circle' },
  { key: 'vehicle', label: 'Problème véhicule', icon: 'truck' },
  { key: 'customer', label: 'Client injoignable', icon: 'user' },
  { key: 'address', label: 'Adresse introuvable', icon: 'mapPin' },
  { key: 'other', label: 'Autre', icon: 'question-mark-circle' },
];

export const IncidentReportSheet: React.FC<IncidentReportSheetProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedType) return;
    onSubmit(selectedType, description, photo || undefined);
    setSelectedType(null);
    setDescription('');
    setPhoto(null);
    setPhotoPreview(null);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Signaler un incident">
      <div className="space-y-5">
        {/* Type d'incident */}
        <div>
          <p className={`${TYPO.label} mb-2`}>Type d'incident</p>
          <div className="grid grid-cols-2 gap-2">
            {INCIDENT_TYPES.map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => setSelectedType(type.key)}
                className={`flex items-center gap-2 rounded-xl p-3 text-left text-sm font-bold transition ${
                  selectedType === type.key
                    ? 'border-2 border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30'
                    : 'border border-surface-border bg-surface-muted text-content-primary hover:bg-surface-border'
                }`}
              >
                <Icon name={type.icon as any} className="h-4 w-4 shrink-0" />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={`${TYPO.label} mb-1.5 block`}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le problème rencontré..."
            rows={3}
            className="w-full rounded-xl border border-surface-border bg-surface-muted px-4 py-3 text-sm text-content-primary placeholder:text-content-muted focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>

        {/* Photo */}
        <div>
          <p className={`${TYPO.label} mb-1.5`}>Photo (optionnel)</p>
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Photo incident"
                className="w-full rounded-xl object-cover"
                style={{ maxHeight: 150 }}
              />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/60 text-white"
              >
                <Icon name="xmark" className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex min-h-[80px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-surface-border bg-surface-muted transition hover:border-brand-blue">
              <Icon name="camera" className="h-6 w-6 text-content-muted" />
              <span className="text-xs font-bold text-content-muted">Prendre une photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={handlePhotoChange}
              />
            </label>
          )}
        </div>

        {/* Submit */}
        <MobileButton
          label={isSubmitting ? 'Envoi...' : 'Envoyer le rapport'}
          icon="warning"
          variant="danger"
          size="lg"
          loading={isSubmitting}
          disabled={!selectedType}
          onClick={handleSubmit}
        />
      </div>
    </BottomSheet>
  );
};

export default IncidentReportSheet;
