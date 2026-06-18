import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { useAppContext } from '../context/AppContext';

interface PricingSuggestion {
  type: 'increase' | 'decrease' | 'promotion' | 'express_premium';
  description: string;
  estimatedImpact: string;
  urgency: 'high' | 'medium' | 'low';
}

interface PricingResult {
  suggestions: PricingSuggestion[];
  reasoning: string;
}

const urgencyColors = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };
const typeIcons: Record<string, string> = { increase: 'chartBar', decrease: 'arrowDownTray', promotion: 'gift', express_premium: 'fire' };
const typeLabels: Record<string, string> = { increase: 'Price Increase', decrease: 'Price Decrease', promotion: 'Promotion', express_premium: 'Express Premium' };

export const SmartPricingAdvisor: React.FC<{ partnerId: string }> = ({ partnerId }) => {
  const [result, setResult] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const { apiSmartPricingAdvice } = await import('../constants');
      const res = await apiSmartPricingAdvice(partnerId);
      setResult(res);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { analyze(); }, [partnerId]);

  return (
    <div className="rounded-3xl border border-surface-border-subtle bg-surface-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black">Smart Pricing Advisor</h3>
        <button onClick={analyze} disabled={loading} className="rounded-xl bg-[#005bd8] px-4 py-2 text-xs font-black text-white disabled:opacity-50">
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {loading && !result && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-muted" />)}
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          <p className="text-sm leading-6 text-content-muted">{result.reasoning}</p>
          {result.suggestions.length > 0 ? (
            <div className="space-y-3">
              {result.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl border border-surface-border-subtle bg-surface-muted p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#005bd8]/10">
                    <Icon name={(typeIcons[s.type] || 'chartBar') as any} className="h-4 w-4 text-[#005bd8]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black">{typeLabels[s.type] || s.type}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${urgencyColors[s.urgency]}`}>{s.urgency}</span>
                    </div>
                    <p className="mt-1 text-xs text-content-muted">{s.description}</p>
                    <p className="mt-1 text-xs font-bold text-[#005bd8]">Impact: {s.estimatedImpact}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-content-muted">No pricing suggestions at this time.</p>
          )}
        </div>
      )}
    </div>
  );
};
