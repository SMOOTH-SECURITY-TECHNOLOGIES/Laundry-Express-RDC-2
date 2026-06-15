import { Icon } from '../../Icon';
import type { CohortRow } from '../../../lib/admin/loyalty-types';

function heatColor(v: number) {
  if (v >= 70) return 'bg-green-100 text-green-800 dark:bg-green-900/30';
  if (v >= 40) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30';
  return 'bg-gray-100 text-gray-600';
}

export function LoyaltyCohortTable({ cohorts }: { cohorts: CohortRow[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="calendar-days" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold">Analyse de cohortes</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-gray-500 uppercase border-b"><th className="text-left py-2 px-2">Cohorte</th><th className="text-center py-2">M0</th><th className="text-center py-2">M1</th><th className="text-center py-2">M2</th><th className="text-center py-2">M3</th><th className="text-center py-2">M4</th></tr></thead>
          <tbody>
            {cohorts.map((c) => (
              <tr key={c.month} className="border-b border-gray-50 dark:border-slate-800">
                <td className="py-2.5 px-2 font-medium">{c.month}</td>
                {[c.m0, c.m1, c.m2, c.m3, c.m4].map((v, i) => (
                  <td key={i} className="py-2.5 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold ${heatColor(v)}`}>{v}%</span></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
