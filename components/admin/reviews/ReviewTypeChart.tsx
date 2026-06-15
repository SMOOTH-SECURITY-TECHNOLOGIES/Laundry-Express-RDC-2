import { Icon } from '../../Icon';
import type { ReviewTypeBreakdown } from '../../../lib/admin/reviews-types';

export function ReviewTypeChart({ types }: { types: ReviewTypeBreakdown[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="list" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold">Avis par type</h3></div>
      <div className="space-y-2">{types.map((t) => (
        <div key={t.reviewType} className="flex justify-between text-xs p-2 rounded-lg bg-gray-50">
          <span>{t.reviewType}</span>
          <span className="text-gray-500">{t.count} — ★ {t.avgRating}</span>
        </div>
      ))}</div>
    </div>
  );
}
