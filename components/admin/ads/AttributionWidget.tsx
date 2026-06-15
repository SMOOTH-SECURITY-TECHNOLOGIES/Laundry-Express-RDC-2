import { Icon } from '../../Icon';
import type { AttributionMetrics } from '../../../lib/admin/ads-types';

export function AttributionWidget({ attribution }: { attribution: AttributionMetrics }) {
  const metrics = [
    { label: 'CPA', value: `${attribution.cpa} $` },
    { label: 'CAC', value: `${attribution.cac} $` },
    { label: 'ROAS', value: `${attribution.roas}x` },
    { label: 'ROI', value: `${attribution.roi}x` },
    { label: 'Revenu attribué', value: `${attribution.attributedRevenue.toLocaleString('fr-FR')} $` },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="currencyDollar" className="w-5 h-5 text-green-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Attribution des revenus</h3>
      </div>
      <p className="text-[10px] text-gray-500 mb-3">Publicité → Clic → Commande → Paiement</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-gray-50 dark:bg-slate-800 p-3 text-center">
            <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{m.value}</p>
            <p className="text-[10px] text-gray-500">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
