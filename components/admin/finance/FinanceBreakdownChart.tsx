import { Icon } from '../../Icon';
import type { RevenueBreakdownItem } from '../../../lib/admin/finance-types';

export function FinanceBreakdownChart({ items, total }: { items: RevenueBreakdownItem[]; total: number }) {
  const r = 54; const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="chartBar" className="w-5 h-5 text-gray-700 dark:text-slate-300" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Répartition des revenus</h3>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-36 h-36 flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
            {items.map((d) => {
              const dash = (d.percent / 100) * circ;
              const el = <circle key={d.category} cx="60" cy="60" r={r} fill="none" stroke={d.color} strokeWidth="14" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} />;
              offset += dash;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{total.toLocaleString('fr-FR')} $</span>
            <span className="text-[9px] text-gray-400">Total</span>
          </div>
        </div>
        <div className="space-y-2 flex-1 w-full">
          {items.map((d) => (
            <div key={d.category} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-gray-700 dark:text-slate-300">{d.category}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-900 dark:text-slate-100">{d.percent}%</span>
                <span className="text-gray-400 ml-2">{d.amount.toLocaleString('fr-FR')} $</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
