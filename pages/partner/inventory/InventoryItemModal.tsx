import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { InventoryItemThumb } from './InventoryItemThumb';

export interface ConsumableFormValues {
  name: string;
  category: string;
  stock: number;
  unit: string;
  threshold: number;
  cost: number;
  icon: string;
  imageUrl: string;
}

interface InventoryItemModalProps {
  isOpen: boolean;
  title: string;
  initial?: Partial<ConsumableFormValues>;
  onClose: () => void;
  onSave: (values: ConsumableFormValues) => void;
}

const defaultValues: ConsumableFormValues = {
  name: '',
  category: 'Consommable',
  stock: 0,
  unit: 'L',
  threshold: 10,
  cost: 0,
  icon: '📦',
  imageUrl: '',
};

const SUGGESTED_IMAGES = [
  { label: 'Lessive', url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=320&q=80' },
  { label: 'Produit', url: 'https://images.unsplash.com/photo-1563453561494-01dd7df3b870?auto=format&fit=crop&w=320&q=80' },
  { label: 'Emballage', url: 'https://images.unsplash.com/photo-1607083206869-4c6672c66f38?auto=format&fit=crop&w=320&q=80' },
  { label: 'Textile', url: 'https://images.unsplash.com/photo-1558171813-4c002d410855?auto=format&fit=crop&w=320&q=80' },
];

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
  isOpen,
  title,
  initial,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<ConsumableFormValues>(defaultValues);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({ ...defaultValues, ...initial });
      setUploadError(null);
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Choisissez un fichier image (JPG, PNG, WebP…).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image trop lourde (max 2 Mo).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setForm((prev) => ({ ...prev, imageUrl: result }));
      setUploadError(null);
    };
    reader.onerror = () => setUploadError('Impossible de lire ce fichier.');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const fieldClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer">
            <Icon name="xmark" className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* ─── Photo (section prioritaire) ─── */}
        <section className="mb-5 rounded-xl border-2 border-dashed border-brand-blue/40 bg-brand-blue/5 p-4 dark:bg-brand-blue/10">
          <p className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Photo de l&apos;article</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <InventoryItemThumb name={form.name || 'Article'} imageUrl={form.imageUrl} icon={form.icon} size="lg" />
            <div className="min-w-0 flex-1 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-blue-700"
              >
                <Icon name="photo" className="h-4 w-4" />
                Importer une photo
              </button>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Ou coller une URL d&apos;image
                </label>
                <input
                  type="url"
                  className={fieldClass}
                  value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://exemple.com/photo.jpg"
                />
              </div>
              {form.imageUrl && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, imageUrl: '' })}
                  className="text-xs font-semibold text-red-500 hover:underline"
                >
                  Supprimer la photo
                </button>
              )}
              {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
            </div>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Images suggérées</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_IMAGES.map((img) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, imageUrl: img.url }))}
                  className="overflow-hidden rounded-lg border-2 border-transparent hover:border-brand-blue focus:border-brand-blue"
                  title={img.label}
                >
                  <img src={img.url} alt={img.label} className="h-12 w-12 object-cover" />
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Nom</label>
            <input
              className={fieldClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Catégorie</label>
              <input
                className={fieldClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Icône (secours)</label>
              <input
                className={fieldClass}
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                maxLength={4}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Stock actuel</label>
              <input
                type="number"
                min={0}
                step="0.1"
                className={fieldClass}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Unité</label>
              <select
                className={fieldClass}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                <option value="L">Litres</option>
                <option value="kg">Kilogrammes</option>
                <option value="unités">Unités</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Seuil d&apos;alerte</label>
              <input
                type="number"
                min={0}
                className={fieldClass}
                value={form.threshold}
                onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Coût unitaire ($)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className={fieldClass}
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-700"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};
