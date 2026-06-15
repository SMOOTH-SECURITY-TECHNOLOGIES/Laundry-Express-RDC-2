import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { PartnerMediaGallery } from '../../../types';
import { partnerBtnGhost, partnerField, partnerLabel, partnerModalTitle } from '../partner-ui';
import {
  emptyMediaGallery,
  flattenGallery,
  PARTNER_PHOTO_CATEGORIES,
  PartnerPhotoCategoryKey,
} from './partnerMedia';

interface Props {
  open: boolean;
  initialGallery: PartnerMediaGallery;
  initialVideoUrl: string;
  initialTab?: PartnerPhotoCategoryKey;
  onClose: () => void;
  onSave: (payload: { mediaGallery: PartnerMediaGallery; imageUrls: string[]; videoUrl: string }) => void;
}

const SUGGESTED_PHOTOS = [
  'https://images.unsplash.com/photo-1545173153-5dd9215b6f57?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=800&q=80',
];

export const PartnerMediaModal: React.FC<Props> = ({
  open,
  initialGallery,
  initialVideoUrl,
  initialTab = 'couverture',
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<PartnerPhotoCategoryKey>('couverture');
  const [gallery, setGallery] = useState<PartnerMediaGallery>(emptyMediaGallery());
  const [videoUrl, setVideoUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setGallery({ ...emptyMediaGallery(), ...initialGallery });
    setVideoUrl(initialVideoUrl || '');
    setUrlInput('');
    setUploadError('');
    setActiveTab(initialTab);
  }, [open, initialGallery, initialVideoUrl, initialTab]);

  if (!open) return null;

  const currentPhotos = gallery[activeTab] || [];

  const addPhoto = (url: string) => {
    if (!url.trim()) return;
    setGallery((prev) => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), url.trim()],
    }));
    setUrlInput('');
    setUploadError('');
  };

  const removePhoto = (index: number) => {
    setGallery((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).filter((_, i) => i !== index),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Choisissez une image (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image trop lourde (max 2 Mo).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) addPhoto(result);
    };
    reader.onerror = () => setUploadError('Impossible de lire ce fichier.');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    onSave({
      mediaGallery: gallery,
      imageUrls: flattenGallery(gallery),
      videoUrl: videoUrl.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} role="presentation" />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-xl">
        <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
          <h2 className={partnerModalTitle}>Photos & videos</h2>
          <button type="button" onClick={onClose} className="text-content-muted hover:text-content-primary" aria-label="Fermer">
            <Icon name="xmark" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className={partnerLabel}>Categorie</label>
            <div className="flex flex-wrap gap-1.5">
              {PARTNER_PHOTO_CATEGORIES.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${
                    activeTab === tab.key ? 'bg-brand-blue text-white' : 'bg-surface-muted text-content-muted'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {currentPhotos.map((url, index) => (
              <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-muted">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Supprimer"
                >
                  <Icon name="xmark" className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {currentPhotos.length === 0 && (
              <div className="col-span-full flex h-28 items-center justify-center rounded-xl border border-dashed border-surface-border text-xs text-content-muted">
                Aucune photo dans cette categorie
              </div>
            )}
          </div>

          <div>
            <label className={partnerLabel}>Ajouter une photo (URL)</label>
            <div className="flex gap-2">
              <input
                className={partnerField}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
              />
              <button type="button" onClick={() => addPhoto(urlInput)} className="shrink-0 rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white">
                Ajouter
              </button>
            </div>
          </div>

          <div>
            <label className={partnerLabel}>Importer depuis votre appareil</label>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-surface-border py-3 text-xs font-medium text-content-muted hover:bg-surface-muted"
            >
              <Icon name="photo" className="h-4 w-4" />
              Choisir une image
            </button>
            {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
          </div>

          <div>
            <label className={partnerLabel}>Suggestions</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SUGGESTED_PHOTOS.map((url) => (
                <button key={url} type="button" onClick={() => addPhoto(url)} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-surface-border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-surface-border pt-4">
            <label className={partnerLabel}>Video de presentation (URL YouTube ou MP4)</label>
            <input
              className={partnerField}
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... ou https://..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-surface-border px-6 py-4">
          <button type="button" onClick={onClose} className={partnerBtnGhost}>Annuler</button>
          <button type="button" onClick={handleSave} className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-700">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};
