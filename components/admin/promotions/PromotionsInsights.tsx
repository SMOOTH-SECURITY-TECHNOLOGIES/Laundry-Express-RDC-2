import { Icon } from '../../Icon';
import type { PromoInsight } from '../../../lib/admin/promotions-types';

export function PromotionsInsights({ insights }: { insights: PromoInsight[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="sparkles" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Insights IA</h3></div>
      <ul className="space-y-2">{insights.map((i) => (
        <li key={i.id} className="flex items-start gap-2 text-xs text-gray-700 dark:text-slate-300">
          <Icon name={i.type === 'success' ? 'check' : i.type === 'warning' ? 'warning' : 'question-mark-circle'} className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {i.text}
        </li>
      ))}</ul>
    </div>
  );
}
