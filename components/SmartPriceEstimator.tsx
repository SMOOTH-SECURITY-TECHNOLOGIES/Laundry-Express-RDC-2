import React, { useState } from 'react';
import { Icon } from './Icon';

interface PriceBreakdown {
  garment: string;
  min: number;
  max: number;
}

interface PriceResult {
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
  breakdown: PriceBreakdown[];
  confidence: number;
  reasoning: string;
}

const COMMUNES = ['Gombe', 'Ngaliema', 'Limete', 'Kintambo', 'Bandalungwa', 'Matete', 'Masina'];
const GARMENT_TYPES = ['Chemise', 'Pantalon', 'Veste', 'Robe', 'Costume', 'Drap', 'Couverture'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartPriceEstimator: React.FC<Props> = ({ isOpen, onClose }) => {
  const [serviceType, setServiceType] = useState('pressing');
  const [commune, setCommune] = useState('Gombe');
  const [volume, setVolume] = useState(5);
  const [selectedGarments, setSelectedGarments] = useState<string[]>(['Chemise', 'Pantalon']);
  const [result, setResult] = useState<PriceResult | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleGarment = (g: string) => {
    setSelectedGarments((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  };

  const estimate = async () => {
    setLoading(true);
    try {
      const { apiSmartPriceEstimate } = await import('../constants');
      const res = await apiSmartPriceEstimate({ serviceType, commune, volume, garmentTypes: selectedGarments });
      setResult(res);
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full bg-black/10 p-2 hover:bg-black/20">
          <Icon name="xmark" className="h-5 w-5" />
        </button>

        <div className="p-6 space-y-5">
          <div className="text-center">
            <Icon name="currencyDollar" className="mx-auto h-10 w-10 text-[#005bd8]" />
            <h2 className="mt-2 text-xl font-black">Estimation IA des prix</h2>
            <p className="text-sm text-content-muted">Estimez le coût avant de commander</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-black uppercase text-content-muted">Service</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="mt-1 w-full rounded-xl border border-surface-border bg-surface-card px-4 py-3 text-sm font-bold">
                <option value="pressing">Nettoyage a sec (Pressing)</option>
                <option value="blanchisserie">Lavage & pliage</option>
                <option value="cordonnerie">Cordonnerie</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-content-muted">Commune</label>
              <select value={commune} onChange={(e) => setCommune(e.target.value)} className="mt-1 w-full rounded-xl border border-surface-border bg-surface-card px-4 py-3 text-sm font-bold">
                {COMMUNES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-content-muted">Volume: {volume} articles</label>
              <input type="range" min="1" max="50" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="mt-1 w-full accent-[#005bd8]" />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-content-muted">Types de vetements</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {GARMENT_TYPES.map((g) => (
                  <button key={g} onClick={() => toggleGarment(g)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${selectedGarments.includes(g) ? 'bg-[#005bd8] text-white' : 'bg-surface-muted text-content-muted'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={estimate} disabled={loading} className="w-full rounded-2xl bg-[#005bd8] py-3.5 font-black text-white disabled:opacity-50">
            {loading ? 'Estimation en cours...' : 'Estimer le prix'}
          </button>

          {result && (
            <div className="space-y-4 border-t border-surface-border pt-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-green-50 p-3">
                  <p className="text-xs font-bold text-green-600">Minimum</p>
                  <p className="text-lg font-black text-green-700">${result.minPrice.toFixed(2)}</p>
                </div>
                <div className="rounded-xl bg-[#005bd8]/10 p-3">
                  <p className="text-xs font-bold text-[#005bd8]">Moyen</p>
                  <p className="text-lg font-black text-[#005bd8]">${result.avgPrice.toFixed(2)}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-xs font-bold text-amber-600">Maximum</p>
                  <p className="text-lg font-black text-amber-700">${result.maxPrice.toFixed(2)}</p>
                </div>
              </div>

              {result.breakdown.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase text-content-muted">Detail par article</p>
                  {result.breakdown.map((b, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-2.5 text-sm">
                      <span className="font-bold">{b.garment}</span>
                      <span className="font-black">${b.min.toFixed(2)} - ${b.max.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl bg-surface-muted p-3">
                <p className="text-xs text-content-muted">{result.reasoning}</p>
                <p className="mt-1 text-xs font-bold text-[#005bd8]">Confiance: {Math.round(result.confidence * 100)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
