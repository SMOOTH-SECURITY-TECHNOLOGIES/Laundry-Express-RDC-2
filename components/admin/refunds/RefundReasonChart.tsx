import { Icon } from '../../Icon';
import type { RefundReasonBreakdown } from '../../../lib/admin/refunds-types';

export function RefundReasonChart({ items }: { items: RefundReasonBreakdown[] }) {
  const r = 54; const circ = 2 * Math.PI * r;
  let offset = 0;
  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="chartBar" className="w-5 h-5 text-gray-700 dark:text-slate-300" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Motifs de remboursement</h3></div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
            {items.map((d) => {
              const dash = (d.percent / 100) * circ;
              const el = <circle key={d.label} cx="60" cy="60" r={r} fill="none" stroke={d.color} strokeWidth="14" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} />;
              offset += dash;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-sm font-bold text-gray-900 dark:text-slate-100">{total}</span><span className="text-[9px] text-gray-400">Total</span></div>
        </div>
        <div className="space-y-2 flex-1 w-full">
          {items.map((d) => (
            <div key={d.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-gray-700 dark:text-slate-300">{d.label}</span></div>
              <span className="font-semibold">{d.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
