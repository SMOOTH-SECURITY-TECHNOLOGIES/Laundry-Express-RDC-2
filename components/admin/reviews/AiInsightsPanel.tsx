import { Icon } from '../../Icon';
import type { AiInsight } from '../../../lib/admin/reviews-types';

export function AiInsightsPanel({ insights }: { insights: AiInsight[] }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="sparkles" className="w-5 h-5 text-purple-600" /><h3 className="text-sm font-semibold text-purple-700">Customer Experience Intelligence</h3></div>
      <ul className="space-y-3 text-xs">{insights.map((i) => (
        <li key={i.id} className="flex gap-2 p-3 rounded-xl bg-purple-50"><Icon name="check" className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" /><span>{i.text}</span></li>
      ))}</ul>
    </div>
  );
}
