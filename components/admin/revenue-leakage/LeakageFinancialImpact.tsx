import { Icon } from '../../Icon';
import type { LeakageFinancialImpact } from '../../../lib/admin/revenue-leakage-types';

export function LeakageFinancialImpactCard({ impact }: { impact: LeakageFinancialImpact }) {
  const items = [
    { label: 'Perte potentielle', value: impact.potentialLoss, color: '#EF4444' },
    { label: 'Perte confirmée', value: impact.confirmedLoss, color: '#F59E0B' },
    { label: 'Montant récupéré ce mois', value: impact.recoveredThisMonth, color: '#22C55E' },
    { label: 'Montant en investigation', value: impact.underInvestigation, color: '#2563EB' },
  ];
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="currencyDollar" className="w-5 h-5 text-red-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Impact financier</h3></div>
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.label} className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-slate-800 px-4 py-3">
            <span className="text-xs text-gray-600 dark:text-slate-400">{i.label}</span>
            <span className="text-sm font-bold" style={{ color: i.color }}>{i.value.toLocaleString('fr-FR')} $</span>
          </div>
        ))}
      </div>
    </div>
  );
}
