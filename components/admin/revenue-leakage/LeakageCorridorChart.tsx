import React from 'react';
import { Icon } from '../../Icon';
import type { LeakageCorridorStep } from '../../../lib/admin/revenue-leakage-types';

export function LeakageCorridorChart({ corridor }: { corridor: LeakageCorridorStep[] }) {
  const max = Math.max(...corridor.map((c) => c.amount));
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="shield" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Leakage par corridor</h3></div>
      <div className="flex flex-wrap items-end gap-3">
        {corridor.map((c, i) => (
          <React.Fragment key={c.name}>
            {i > 0 && <span className="text-gray-300 self-center">→</span>}
            <div className="text-center min-w-[70px]">
              <div className="mx-auto w-12 rounded-t-lg bg-red-500/80" style={{ height: `${Math.max(20, (c.amount / max) * 80)}px` }} />
              <p className="text-[10px] font-semibold text-gray-900 dark:text-slate-100 mt-1">{c.name}</p>
              <p className="text-[9px] text-gray-500">{c.count} cas</p>
              <p className="text-[9px] font-bold text-red-600">{c.amount.toLocaleString('fr-FR')} $</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
