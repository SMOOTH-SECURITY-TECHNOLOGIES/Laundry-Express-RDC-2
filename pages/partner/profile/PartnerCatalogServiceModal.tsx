import React, { useEffect, useState } from 'react';
import { Icon } from '../../../components/Icon';
import {
  CatalogPartnerService,
  CatalogResponse,
  realApi,
} from '../../../services/real-api';
import { partnerBtnGhost, partnerField, partnerLabel, partnerModalTitle } from '../partner-ui';

type PricingMode = 'unit' | 'kg' | 'fixed';

const normalizePricingMode = (mode?: string): PricingMode => {
  const value = (mode || 'unit').toLowerCase();
  if (value === 'kg' || value === 'fixed') return value;
  return 'unit';
};

interface Props {
  open: boolean;
  partnerId: string;
  service?: CatalogPartnerService | null;
  onClose: () => void;
  onSaved: () => void;
}

export const PartnerCatalogServiceModal: React.FC<Props> = ({
  open,
  partnerId,
  service,
  onClose,
  onSaved,
}) => {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [basePrice, setBasePrice] = useState('5');
  const [pricingMode, setPricingMode] = useState<PricingMode>('unit');
  const [turnaround, setTurnaround] = useState('24');
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    realApi.getCatalog().then(setCatalog).catch(() => setCatalog(null));
    if (service) {
      setCategoryId(service.service_category_id);
      setTypeId(service.service_type_id);
      setBasePrice(String(service.base_price));
      setPricingMode(normalizePricingMode(service.pricing_mode));
      setTurnaround(String(service.estimated_turnaround_hours));
      setIsAvailable(service.is_available);
    } else {
      setCategoryId('');
      setTypeId('');
      setBasePrice('5');
      setPricingMode('unit');
      setTurnaround('24');
      setIsAvailable(true);
    }
    setError('');
  }, [open, service]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !typeId) {
      setError('Selectionnez une categorie et un type de service.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        service_category_id: categoryId,
        service_type_id: typeId,
        base_price: parseFloat(basePrice) || 0,
        pricing_mode: pricingMode,
        estimated_turnaround_hours: parseInt(turnaround, 10) || 24,
        is_available: isAvailable,
      };
      if (service) {
        await realApi.updatePartnerCatalogService(partnerId, service.id, payload);
      } else {
        await realApi.createPartnerCatalogService(partnerId, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof TypeError && /failed to fetch/i.test(err.message)) {
        setError('Impossible de contacter le serveur. Verifiez que l\'API est demarree.');
      } else {
        setError(err instanceof Error ? err.message : 'Impossible de sauvegarder le service.');
      }
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
          <h2 className={partnerModalTitle}>{service ? 'Modifier le service' : 'Ajouter un service'}</h2>
          <button type="button" onClick={onClose} className="text-content-muted hover:text-content-primary" aria-label="Fermer">
            <Icon name="xmark" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={partnerLabel}>Categorie *</label>
            <select className={partnerField} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              <option value="">Choisir…</option>
              {catalog?.service_categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={partnerLabel}>Type *</label>
            <select className={partnerField} value={typeId} onChange={(e) => setTypeId(e.target.value)} required>
              <option value="">Choisir…</option>
              {catalog?.service_types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={partnerLabel}>Prix de base *</label>
              <input type="number" min={0} step="0.01" className={partnerField} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required />
            </div>
            <div>
              <label className={partnerLabel}>Mode</label>
              <select className={partnerField} value={pricingMode} onChange={(e) => setPricingMode(e.target.value as PricingMode)}>
                <option value="unit">A l&apos;unite</option>
                <option value="kg">Au kg</option>
                <option value="fixed">Forfait</option>
              </select>
            </div>
          </div>
          <div>
            <label className={partnerLabel}>Delai (heures)</label>
            <input type="number" min={1} className={partnerField} value={turnaround} onChange={(e) => setTurnaround(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-content-primary">
            <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
            Service actif (visible aux clients)
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={partnerBtnGhost}>Annuler</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-700 disabled:opacity-60">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
};
