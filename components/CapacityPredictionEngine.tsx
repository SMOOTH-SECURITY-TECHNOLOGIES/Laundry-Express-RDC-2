import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface CapacityResult {
  prediction: 'low' | 'normal' | 'high' | 'overloaded';
  load: number;
  recommendation: string;
  estimatedSaturation?: string;
  suggestedActions?: string[];
}

const predictionColors = { low: 'text-green-600', normal: 'text-[#005bd8]', high: 'text-amber-500', overloaded: 'text-red-600' };
const predictionBg = { low: 'bg-green-500', normal: 'bg-[#005bd8]', high: 'bg-amber-500', overloaded: 'bg-red-500' };
const predictionLabels = { low: 'Low Load', normal: 'Normal', high: 'High Load', overloaded: 'Overloaded' };

export const CapacityPredictionEngine: React.FC = () => {
  const [result, setResult] = useState<CapacityResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const { apiCheckCapacity } = await import('../constants');
      const res = await apiCheckCapacity();
      setResult(res);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { analyze(); }, []);

  return (
    <div className="rounded-3xl border border-surface-border-subtle bg-surface-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black">Capacity Prediction</h3>
        <button onClick={analyze} disabled={loading} className="rounded-xl bg-[#005bd8] px-4 py-2 text-xs font-black text-white disabled:opacity-50">
          {loading ? 'Predicting...' : 'Refresh'}
        </button>
      </div>

      {loading && !result && (
        <div className="mt-6 space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-surface-muted" />
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                <path className="text-surface-muted" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={predictionColors[result.prediction]} stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray={`${result.load}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-black">{result.load}%</span>
            </div>
            <div>
              <p className={`text-lg font-black ${predictionColors[result.prediction]}`}>{predictionLabels[result.prediction]}</p>
              <p className="text-sm text-content-muted">{result.recommendation}</p>
            </div>
          </div>

          {result.estimatedSaturation && (
            <div className="rounded-xl bg-surface-muted px-4 py-2.5 text-sm">
              <span className="font-bold text-content-muted">Saturation: </span>
              <span className="font-black">{result.estimatedSaturation}</span>
            </div>
          )}

          {result.suggestedActions && result.suggestedActions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black uppercase text-content-muted">Suggested Actions</p>
              {result.suggestedActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-[#005bd8]" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
