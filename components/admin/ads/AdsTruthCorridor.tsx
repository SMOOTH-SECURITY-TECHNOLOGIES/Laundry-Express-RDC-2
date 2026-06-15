import React from 'react';
import { Icon } from '../../Icon';
import type { TruthAnomaly } from '../../../lib/admin/ads-types';

const severityStyle: Record<string, { bg: string; border: string; text: string }> = {
  critical: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300' },
  warning: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300' },
  info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
};

const corridorSteps = ['Publicité', 'Clic', 'Commande', 'Paiement'];

export function AdsTruthCorridor({ anomalies }: { anomalies: TruthAnomaly[] }) {
  const criticalCount = anomalies.filter((a) => a.severity === 'critical').length;
  const warningCount = anomalies.filter((a) => a.severity === 'warning').length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="shield" className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Advertising Truth</h3>
        </div>
        {(criticalCount > 0 || warningCount > 0) && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: 'Anomalies' }))}
            className="text-[10px] font-bold text-orange-600 hover:underline"
          >
            → Anomaly Center
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {corridorSteps.map((step, i) => (
          <React.Fragment key={step}>
            {i > 0 && <span className="text-gray-300 dark:text-slate-600">→</span>}
            <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-2 text-center min-w-[80px]">
              <p className="text-xs font-semibold">{step}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {anomalies.length === 0 && (
          <p className="text-xs text-green-600 font-medium flex items-center gap-1">
            <Icon name="check" className="w-3.5 h-3.5" /> Aucune anomalie détectée
          </p>
        )}
        {anomalies.map((a) => {
          const st = severityStyle[a.severity] || severityStyle.info;
          return (
            <div key={a.id} className={`rounded-lg border px-3 py-2 text-xs ${st.border} ${st.bg} ${st.text}`}>
              {a.message}
            </div>
          );
        })}
      </div>
    </div>
  );
}
