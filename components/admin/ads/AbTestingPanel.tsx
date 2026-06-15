import { Icon } from '../../Icon';
import type { AbTest } from '../../../lib/admin/ads-types';

export function AbTestingPanel({ tests }: { tests: AbTest[] }) {
  if (!tests.length) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="chartBar" className="w-5 h-5 text-orange-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">A/B Testing</h3>
        </div>
        <p className="text-xs text-gray-500">Aucun test en cours.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="chartBar" className="w-5 h-5 text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">A/B Testing en cours</h3>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[10px] text-gray-500 uppercase border-b">
            <th className="text-left py-2">Variante</th>
            <th className="text-right py-2">CTR</th>
            <th className="text-right py-2">Conversion</th>
            <th className="text-right py-2">ROI</th>
          </tr>
        </thead>
        <tbody>
          {tests.flatMap((t) => [
            <tr key={`${t.id}-a`} className={t.winner === 'A' ? 'bg-green-50 dark:bg-green-900/10' : ''}>
              <td className="py-2.5 font-medium">{t.variantA}{t.winner === 'A' && <span className="ml-1 text-[9px] text-green-600 font-bold">★ Winner</span>}</td>
              <td className="py-2.5 text-right">{t.variantACtr}%</td>
              <td className="py-2.5 text-right">{t.variantAConversion}%</td>
              <td className="py-2.5 text-right font-bold text-green-600">{t.variantARoi}x</td>
            </tr>,
            <tr key={`${t.id}-b`} className={t.winner === 'B' ? 'bg-green-50 dark:bg-green-900/10' : ''}>
              <td className="py-2.5 font-medium">{t.variantB}{t.winner === 'B' && <span className="ml-1 text-[9px] text-green-600 font-bold">★ Winner</span>}</td>
              <td className="py-2.5 text-right">{t.variantBCtr}%</td>
              <td className="py-2.5 text-right">{t.variantBConversion}%</td>
              <td className="py-2.5 text-right font-bold text-green-600">{t.variantBRoi}x</td>
            </tr>,
          ])}
        </tbody>
      </table>
    </div>
  );
}
