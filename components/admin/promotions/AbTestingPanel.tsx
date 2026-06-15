import { Icon } from '../../Icon';
import type { AbTestVariant } from '../../../lib/admin/promotions-types';

export function AbTestingPanel({ tests }: { tests: AbTestVariant[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="chartBar" className="w-5 h-5 text-orange-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">A/B Tests en cours</h3></div>
      <table className="w-full text-xs">
        <thead><tr className="text-[10px] text-gray-500 uppercase border-b"><th className="text-left py-2">Variation</th><th className="text-right py-2">Conversion</th><th className="text-right py-2">ROI</th><th className="text-right py-2">Panier moy.</th></tr></thead>
        <tbody>{tests.map((t) => (
          <tr key={t.id} className={`border-b border-gray-50 dark:border-slate-800 ${t.isWinner ? 'bg-green-50 dark:bg-green-900/10' : ''}`}>
            <td className="py-2.5 font-medium">{t.name}{t.isWinner && <span className="ml-1 text-[9px] text-green-600 font-bold">★ Winner</span>}</td>
            <td className="py-2.5 text-right">{t.conversionRate}%</td>
            <td className="py-2.5 text-right font-bold text-green-600">{t.roi}x</td>
            <td className="py-2.5 text-right">{t.avgBasket.toFixed(2)} $</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
