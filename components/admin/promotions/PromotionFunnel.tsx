import { Icon } from '../../Icon';
import type { PromoFunnelStep } from '../../../lib/admin/promotions-types';

export function PromotionFunnel({ funnel }: { funnel: PromoFunnelStep[] }) {
  const max = funnel[0]?.count || 1;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="chartBar" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Funnel de conversion des promotions</h3></div>
      <div className="space-y-2">
        {funnel.map((step, i) => (
          <div key={step.stage}>
            <div className="flex justify-between text-xs mb-1"><span className="font-medium text-gray-900 dark:text-slate-100">{step.stage}</span><span className="font-bold">{step.count.toLocaleString('fr-FR')} ({step.percent}%)</span></div>
            <div className="h-6 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-end pr-2" style={{ width: `${(step.count / max) * 100}%` }}>
                {i < funnel.length - 1 && <span className="text-[9px] text-white font-bold">↓</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
