import React from 'react';
import { Icon } from '../../Icon';
import type { CommissionTruthCorridor as CorridorType } from '../../../lib/admin/commissions-types';

const statusStyle = (s: string) =>
  s === 'healthy' ? { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300', label: 'Healthy' } :
  s === 'warning' ? { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300', label: 'Warning' } :
  { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300', label: 'Critical' };

export function CommissionTruthCorridor({ corridors }: { corridors: CorridorType[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="shield" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Commission Truth Corridor</h3></div>
      <div className="flex flex-wrap items-center gap-2">
        {corridors.map((c, i) => {
          const st = statusStyle(c.status);
          return (
            <React.Fragment key={c.id}>
              {i > 0 && <span className="text-gray-300 dark:text-slate-600">→</span>}
              <div className={`rounded-xl border ${st.border} ${st.bg} px-4 py-3 text-center min-w-[90px]`}>
                <p className="text-xs font-semibold text-gray-900 dark:text-slate-100">{c.name}</p>
                <p className={`text-[10px] font-bold mt-1 ${st.text}`}>{st.label}</p>
                {c.issues > 0 && <p className="text-[9px] text-gray-500 mt-0.5">{c.issues} issue{c.issues > 1 ? 's' : ''}</p>}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
