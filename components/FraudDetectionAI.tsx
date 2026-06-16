import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface FraudRisk {
  type: 'multi_account' | 'promo_abuse' | 'suspicious_payment' | 'suspicious_behavior';
  severity: 'high' | 'medium' | 'low';
  description: string;
  affectedCount: number;
  recommendation: string;
}

interface FraudResult {
  risks: FraudRisk[];
  summary: string;
}

const severityColors = { high: 'bg-red-100 text-red-700 border-red-200', medium: 'bg-amber-100 text-amber-700 border-amber-200', low: 'bg-green-100 text-green-700 border-green-200' };
const typeIcons: Record<string, string> = { multi_account: 'users', promo_abuse: 'gift', suspicious_payment: 'credit-card', suspicious_behavior: 'warning' };
const typeLabels: Record<string, string> = { multi_account: 'Comptes multiples', promo_abuse: 'Abus promo', suspicious_payment: 'Paiement suspect', suspicious_behavior: 'Comportement suspect' };

export const FraudDetectionAI: React.FC = () => {
  const [result, setResult] = useState<FraudResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const { apiDetectFraud } = await import('../constants');
      const res = await apiDetectFraud();
      setResult(res);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { analyze(); }, []);

  return (
    <div className="rounded-3xl border border-surface-border-subtle bg-surface-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black">Fraud Detection AI</h3>
        <button onClick={analyze} disabled={loading} className="rounded-xl bg-[#005bd8] px-4 py-2 text-xs font-black text-white disabled:opacity-50">
          {loading ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {loading && !result && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-muted" />)}
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          <p className="text-sm leading-6 text-content-muted">{result.summary}</p>

          {result.risks.length > 0 ? (
            <div className="space-y-3">
              {result.risks.map((risk, i) => (
                <div key={i} className={`rounded-2xl border p-4 ${severityColors[risk.severity]}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/60">
                      <Icon name={(typeIcons[risk.type] || 'warning') as any} className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black">{typeLabels[risk.type] || risk.type}</span>
                        <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-black uppercase">{risk.severity}</span>
                        <span className="text-xs font-bold">{risk.affectedCount} affectes</span>
                      </div>
                      <p className="mt-1 text-xs opacity-80">{risk.description}</p>
                      <p className="mt-1 text-xs font-bold underline">Action: {risk.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-green-50 p-4 text-center">
              <Icon name="shield-check" className="mx-auto h-8 w-8 text-green-600" />
              <p className="mt-2 text-sm font-bold text-green-700">Aucun risque detecte</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
