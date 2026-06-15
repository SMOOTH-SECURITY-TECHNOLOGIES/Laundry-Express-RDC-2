import { Icon } from '../../Icon';
import type { FunnelStep } from '../../../lib/admin/ads-types';

export function AdFunnel({ funnel }: { funnel: FunnelStep[] }) {
  const max = funnel[0]?.count || 1;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="chartBar" className="w-5 h-5 text-purple-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Funnel publicitaire</h3>
      </div>
      <div className="space-y-2">
        {funnel.map((step, i) => (
          <div key={step.stage}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-gray-900 dark:text-slate-100">{step.stage}</span>
              <span className="font-bold">{step.count.toLocaleString('fr-FR')} ({step.rate}%)</span>
            </div>
            <div className="h-6 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-end pr-2"
                style={{ width: `${Math.max((step.count / max) * 100, 2)}%` }}
              >
                {i < funnel.length - 1 && <span className="text-[9px] text-white font-bold">↓</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
