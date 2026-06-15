import { Icon } from '../../Icon';
import type { PaymentInsight } from '../../../lib/admin/payments-types';

export function PaymentsInsights({ insights }: { insights: PaymentInsight[] }) {
  const iconFor = (t: string) => t === 'positive' ? 'check' : t === 'negative' ? 'warning' : 'sparkles';
  const colorFor = (t: string) => t === 'positive' ? 'text-green-600' : t === 'negative' ? 'text-red-600' : 'text-blue-600';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="sparkles" className="w-5 h-5 text-violet-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Insights IA</h3></div>
      <div className="space-y-3">
        {insights.map((i) => (
          <div key={i.id} className="flex items-start gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800">
            <Icon name={iconFor(i.type) as 'check'} className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorFor(i.type)}`} />
            <p className="text-xs text-gray-700 dark:text-slate-300">{i.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
