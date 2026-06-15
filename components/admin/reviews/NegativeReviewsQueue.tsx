import { Icon } from '../../Icon';
import type { NegativeReview } from '../../../lib/admin/reviews-types';

const PRIO: Record<string, string> = { high: 'bg-red-100 text-red-700 border-red-200', medium: 'bg-orange-100 text-orange-700 border-orange-200', low: 'bg-yellow-100 text-yellow-700 border-yellow-200' };

export function NegativeReviewsQueue({ items }: { items: NegativeReview[] }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="warning" className="w-5 h-5 text-red-600" /><h3 className="text-sm font-semibold text-red-700">Avis négatifs à traiter</h3></div>
      <div className="space-y-2">{items.map((i) => (
        <div key={i.id} className={`flex justify-between items-center p-3 rounded-xl border text-xs ${PRIO[i.priority] ?? ''}`}>
          <div><p className="font-medium">{i.author}</p><p className="text-gray-600 mt-0.5">{i.problem}</p></div>
          <span className="uppercase text-[10px] font-bold">{i.priority}</span>
        </div>
      ))}</div>
    </div>
  );
}
