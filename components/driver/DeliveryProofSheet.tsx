import React, { useState } from 'react';
import { Icon } from '../Icon';
import { BottomSheet } from '../ui/BottomSheet';
import { MobileButton } from '../ui/MobileButton';
import { CARD, TYPO, SPACING } from '../ui/tokens';

interface DeliveryProofSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (photo: File | null, comment: string) => void;
  isSubmitting: boolean;
}

export const DeliveryProofSheet: React.FC<DeliveryProofSheetProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [comment, setComment] = useState('');

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
    onSubmit(photo, comment);
    setPhoto(null);
    setPhotoPreview(null);
    setComment('');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Preuve de livraison">
      <div className="space-y-4">
        <p className={TYPO.sectionSubtitle}>
          Prenez une photo des articles livrés pour confirmer la livraison.
        </p>

        {photoPreview ? (
          <div className="relative">
            <img
              src={photoPreview}
              alt="Preuve de livraison"
              className="w-full rounded-2xl object-cover"
              style={{ maxHeight: 200 }}
            />
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                setPhotoPreview(null);
              }}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/60 text-white"
            >
              <Icon name="xmark" className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-surface-border bg-surface-muted transition hover:border-brand-blue hover:bg-brand-blue/5">
            <Icon name="camera" className="h-8 w-8 text-content-muted" />
            <span className="text-sm font-bold text-content-muted">Prendre une photo</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={handlePhotoChange}
            />
          </label>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-bold text-content-muted">Commentaire (optionnel)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ex: Livré au gardien, étage 3..."
            rows={2}
            className="w-full rounded-2xl border border-surface-border bg-surface-muted px-4 py-3 text-sm text-content-primary placeholder:text-content-muted focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>

        <MobileButton
          label={isSubmitting ? 'Envoi...' : 'Confirmer la livraison'}
          icon="check"
          variant="success"
          size="lg"
          loading={isSubmitting}
          onClick={handleSubmit}
        />
      </div>
    </BottomSheet>
  );
};

export default DeliveryProofSheet;
