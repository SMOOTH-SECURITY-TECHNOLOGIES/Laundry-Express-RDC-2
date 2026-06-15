import { Icon } from '../../Icon';
import type { AdInsight } from '../../../lib/admin/ads-types';

const typeStyle: Record<string, string> = {
  success: 'border-green-200 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200',
  warning: 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200',
  info: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
};

export function AdsInsights({ insights }: { insights: AdInsight[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="sparkles" className="w-5 h-5 text-purple-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Marketing Insights AI</h3>
      </div>
      <div className="space-y-2">
        {insights.length === 0 && <p className="text-xs text-gray-500">Analyse en cours...</p>}
        {insights.map((i) => (
          <div key={i.id} className={`rounded-xl border px-3 py-2 text-xs ${typeStyle[i.type] || typeStyle.info}`}>
            {i.text}
          </div>
        ))}
      </div>
    </div>
  );
}
