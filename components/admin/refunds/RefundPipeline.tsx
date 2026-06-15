import React from 'react';
import { Icon } from '../../Icon';
import type { RefundPipelineSummary } from '../../../lib/admin/refunds-types';

export function RefundPipeline({ pipeline }: { pipeline: RefundPipelineSummary }) {
  const totalDays = Math.floor(pipeline.totalAvgHours / 24);
  const totalHrs = pipeline.totalAvgHours % 24;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="arrowRight" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Pipeline des remboursements</h3></div>
      <div className="flex flex-wrap items-center gap-1 mb-4">
        {pipeline.stages.map((s, i) => (
          <React.Fragment key={s.id}>
            {i > 0 && <span className="text-gray-300 dark:text-slate-600 text-xs">→</span>}
            <div className="flex flex-col items-center px-2 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 min-w-[72px]">
              <span className="text-lg font-bold text-gray-900 dark:text-slate-100">{s.count}</span>
              <span className="text-[9px] text-gray-500 dark:text-slate-400 text-center leading-tight">{s.label}</span>
              <span className="text-[8px] text-blue-600 mt-0.5">{s.slaPercent}% SLA</span>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Temps moyen total', value: `${totalDays}j ${totalHrs}h` },
          { label: 'SLA respecté', value: `${pipeline.slaRespected}%` },
          { label: 'En retard', value: String(pipeline.overdue) },
        ].map((m) => (
          <div key={m.label} className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 text-center">
            <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{m.value}</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
